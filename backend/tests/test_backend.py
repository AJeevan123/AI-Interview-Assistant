import io
import uuid
import pytest
import pymupdf
import docx
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_database

client = TestClient(app)

@pytest.fixture(scope="module")
def test_user():
    """Creates a unique test candidate account."""
    unique_email = f"test_cand_{uuid.uuid4().hex[:8]}@test.com"
    resp = client.post("/api/auth/register", json={
        "name": "Integration Tester",
        "email": unique_email,
        "password": "Password123!"
    })
    assert resp.status_code == 201
    data = resp.json()
    token = data["access_token"]
    user_id = data["user"]["id"]
    return {"token": token, "email": unique_email, "id": user_id, "headers": {"Authorization": f"Bearer {token}"}}

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["database"]["type"] == "MongoDB"
    assert data["database"]["status"] == "connected"

def test_user_registration_duplicate_prevention(test_user):
    resp = client.post("/api/auth/register", json={
        "name": "Duplicate Tester",
        "email": test_user["email"],
        "password": "Password123!"
    })
    assert resp.status_code == 400
    assert "already exists" in resp.json()["detail"].lower()

def test_login_success_and_failure(test_user):
    # Invalid password
    bad_login = client.post("/api/auth/login", json={
        "email": test_user["email"],
        "password": "WrongPassword!"
    })
    assert bad_login.status_code == 401

    # Valid login
    good_login = client.post("/api/auth/login", json={
        "email": test_user["email"],
        "password": "Password123!"
    })
    assert good_login.status_code == 200
    assert "access_token" in good_login.json()

def test_get_current_user_profile(test_user):
    resp = client.get("/api/auth/me", headers=test_user["headers"])
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == test_user["email"]
    assert data["name"] == "Integration Tester"

def test_interview_lifecycle_and_independent_scoring(test_user):
    # 1. Start Interview
    start_resp = client.post("/api/interviews/start", json={
        "role": "Python Developer",
        "interview_type": "Technical",
        "difficulty": "Medium",
        "question_count": 3
    }, headers=test_user["headers"])
    assert start_resp.status_code == 201
    int_data = start_resp.json()
    interview_id = int_data["interview_id"]
    q1 = int_data["current_question"]
    assert q1["question_number"] == 1
    assert len(q1["question_text"]) > 10

    # 2. Submit high-quality answer for Question 1
    good_answer = (
        "In Python, the Global Interpreter Lock (GIL) is a mutex that prevents multiple native threads "
        "from executing Python bytecode simultaneously. For I/O bound concurrency we leverage asyncio "
        "or threading, whereas for CPU-bound computations we utilize multiprocessing or C-extensions."
    )
    ans1_resp = client.post(
        f"/api/interviews/{interview_id}/answer?question_id={q1['id']}",
        json={"candidate_answer": good_answer, "question_id": q1["id"]},
        headers=test_user["headers"]
    )
    assert ans1_resp.status_code == 200
    ans1_data = ans1_resp.json()
    assert ans1_data["score"] >= 7.0
    assert ans1_data["technical_score"] > 0
    assert len(ans1_data["feedback"]) > 10

    # 3. Get next question (#2)
    next_q_resp = client.post(f"/api/interviews/{interview_id}/next-question", headers=test_user["headers"])
    assert next_q_resp.status_code == 200
    q2 = next_q_resp.json()
    assert q2["question_number"] == 2
    assert q2["id"] != q1["id"]

    # 4. Submit weak / brief answer for Question 2
    weak_answer = "It is lock."
    ans2_resp = client.post(
        f"/api/interviews/{interview_id}/answer?question_id={q2['id']}",
        json={"candidate_answer": weak_answer, "question_id": q2["id"]},
        headers=test_user["headers"]
    )
    assert ans2_resp.status_code == 200
    ans2_data = ans2_resp.json()
    
    # Verify independent evaluation: weak answer score must be substantially lower than good answer!
    assert ans2_data["score"] < ans1_data["score"]
    assert ans2_data["score"] <= 5.0
    assert ans2_data["score"] != ans1_data["score"]

    # 5. Complete Interview
    complete_resp = client.post(f"/api/interviews/{interview_id}/complete", headers=test_user["headers"])
    assert complete_resp.status_code == 200
    report_data = complete_resp.json()
    assert report_data["status"] == "completed"
    assert report_data["overall_score"] > 0
    assert len(report_data["strengths"]) > 0
    assert len(report_data["weaknesses"]) > 0

    # 6. Check report download (Text download)
    txt_download = client.get(f"/api/interviews/{interview_id}/download", headers=test_user["headers"])
    assert txt_download.status_code == 200
    assert "AI INTERVIEW COACH" in txt_download.text

    # 7. Check PDF report download
    pdf_download = client.get(f"/api/reports/{interview_id}/download", headers=test_user["headers"])
    assert pdf_download.status_code == 200
    assert pdf_download.headers["content-type"] == "application/pdf"
    assert pdf_download.content.startswith(b"%PDF")

def test_resume_upload_pdf(test_user):
    # Generate test PDF in memory using PyMuPDF
    pdf_doc = pymupdf.open()
    page = pdf_doc.new_page()
    page.insert_text(
        (50, 72),
        "John Doe\nEmail: john.doe@example.com\nPhone: (555) 123-4567\n"
        "Education: B.Tech in Artificial Intelligence\n"
        "Skills: Python, FastAPI, React, Docker, Machine Learning, PyTorch, MongoDB\n"
        "Projects: AI Interview Assistant - Built real-time interviewer platform.\n"
    )
    pdf_bytes = pdf_doc.tobytes()
    pdf_doc.close()

    files = {"file": ("test_resume.pdf", pdf_bytes, "application/pdf")}
    resp = client.post("/api/resume/upload", files=files, headers=test_user["headers"])
    assert resp.status_code == 200
    data = resp.json()
    assert "extracted_text" in data
    assert "analysis" in data
    assert "Python" in data["analysis"]["skills"]
    assert len(data["analysis"]["recommended_questions"]) > 0

def test_resume_upload_docx(test_user):
    # Generate test DOCX in memory
    doc = docx.Document()
    doc.add_heading("Jane Smith", 0)
    doc.add_paragraph("Email: jane.smith@example.com | Phone: 555-987-6543")
    doc.add_paragraph("Skills: Java, Spring Boot, PostgreSQL, Microservices, Kubernetes")
    doc.add_paragraph("Experience: Software Developer building scalable cloud applications.")
    docx_buf = io.BytesIO()
    doc.save(docx_buf)
    docx_bytes = docx_buf.getvalue()

    files = {"file": ("test_resume.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    resp = client.post("/api/resume/upload", files=files, headers=test_user["headers"])
    assert resp.status_code == 200
    data = resp.json()
    assert "Java" in data["analysis"]["skills"]

def test_voice_transcribe_endpoint(test_user):
    # Create mock audio payload
    mock_audio = b"RIFFmockwavdataforvoicetesting12345"
    files = {"audio": ("sample_recording.wav", mock_audio, "audio/wav")}
    resp = client.post("/api/voice/transcribe", files=files, headers=test_user["headers"])
    assert resp.status_code == 200
    data = resp.json()
    assert "transcript" in data
    assert data["status"] in ["success", "fallback"]

def test_dashboard_and_progress_analytics(test_user):
    resp = client.get("/api/progress", headers=test_user["headers"])
    assert resp.status_code == 200
    data = resp.json()
    assert "interviews_completed" in data
    assert "average_score" in data
    assert "questions_answered" in data
    assert data["questions_answered"] >= 2

def test_user_data_isolation():
    u_suffix = uuid.uuid4().hex[:8]
    # User A starts interview
    reg_a = client.post("/api/auth/register", json={
        "name": "User Alpha",
        "email": f"user_alpha_{u_suffix}@test.com",
        "password": "Password123!"
    })
    token_a = reg_a.json()["access_token"]
    
    int_a = client.post("/api/interviews/start", json={
        "role": "AI / ML Engineer",
        "interview_type": "Technical",
        "difficulty": "Easy",
        "question_count": 2
    }, headers={"Authorization": f"Bearer {token_a}"})
    int_id_a = int_a.json()["interview_id"]

    # User B tries to view or delete User A's interview
    reg_b = client.post("/api/auth/register", json={
        "name": "User Beta",
        "email": f"user_beta_{u_suffix}@test.com",
        "password": "Password123!"
    })
    token_b = reg_b.json()["access_token"]

    unauth_view = client.get(f"/api/interviews/{int_id_a}", headers={"Authorization": f"Bearer {token_b}"})
    assert unauth_view.status_code == 404

    unauth_delete = client.delete(f"/api/interviews/{int_id_a}", headers={"Authorization": f"Bearer {token_b}"})
    assert unauth_delete.status_code == 404
