import sys
import os
import io
import json
import pypdf
from datetime import datetime

# Add current path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database.database import init_db

client = TestClient(app)

def run_tests():
    print("=== STARTING AI INTERVIEW ASSISTANT FULL-SYSTEM VERIFICATION ===")
    
    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    health_data = res.json()
    print(f"[PASS] Health check: Status={health_data['status']}, DemoMode={health_data['demo_mode']}")
    assert "college_meta" in health_data
    print(f"[PASS] College project info present: Group {health_data['college_meta']['group']}, Supervisor {health_data['college_meta']['supervisor']}")

    # 2. Register a test student user
    test_email = f"test_student_{datetime.now().strftime('%H%M%S')}@example.com"
    reg_payload = {
        "name": "Kodi Janaki Rao",
        "email": test_email,
        "password": "securepassword123"
    }
    res = client.post("/api/auth/register", json=reg_payload)
    assert res.status_code == 200, f"Registration failed: {res.text}"
    auth_data = res.json()
    token = auth_data["access_token"]
    user_id = auth_data["user"]["id"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"[PASS] User registration successful for {test_email} (ID: {user_id})")

    # 3. Login check
    login_res = client.post("/api/auth/login", json={"email": test_email, "password": "securepassword123"})
    assert login_res.status_code == 200
    print("[PASS] User login verification passed")

    # 4. Auth Me check
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == test_email
    print("[PASS] /api/auth/me token authorization passed")

    # 5. Create new interview session
    interview_payload = {
        "role": "AI / ML Engineer",
        "interview_type": "Technical",
        "difficulty": "Medium",
        "question_count": 3,
        "resume_text": "Experienced with Python, PyTorch, CNNs, Transformers, and gradient descent optimization.",
        "jd_text": "Looking for an ML engineer who can develop and deploy neural network models."
    }
    int_res = client.post("/api/interviews", json=interview_payload, headers=headers)
    assert int_res.status_code == 200, f"Interview creation failed: {int_res.text}"
    int_data = int_res.json()
    interview_id = int_data["interview_id"]
    q1 = int_data["current_question"]
    print(f"[PASS] Interview created: ID={interview_id}")
    print(f"       Q1 (#{q1['question_number']}): {q1['question_text']}")

    # 6. Submit answer to Q1
    q1_answer = "Supervised learning trains with labeled data such as classification, while unsupervised learning discovers patterns in unlabeled data like clustering."
    ans1_res = client.post(
        f"/api/interviews/{interview_id}/answer?question_id={q1['id']}",
        json={"answer_text": q1_answer},
        headers=headers
    )
    assert ans1_res.status_code == 200, f"Submit answer failed: {ans1_res.text}"
    ans1_data = ans1_res.json()
    print(f"[PASS] Q1 Answer Evaluated: Score={ans1_data['score']}/10, Tech={ans1_data['technical_score']}/10")
    print(f"       Feedback: {ans1_data['feedback']}")

    # 7. Request Q2
    q2_res = client.post(f"/api/interviews/{interview_id}/next-question", headers=headers)
    assert q2_res.status_code == 200
    q2 = q2_res.json()
    print(f"[PASS] Q2 Generated (#{q2['question_number']}): {q2['question_text']}")

    # 8. Submit answer to Q2
    q2_answer = "Overfitting is when the model memorizes training noise instead of generalizing. We mitigate it using L2 weight decay regularization and dropout layers."
    ans2_res = client.post(
        f"/api/interviews/{interview_id}/answer?question_id={q2['id']}",
        json={"answer_text": q2_answer},
        headers=headers
    )
    assert ans2_res.status_code == 200
    ans2_data = ans2_res.json()
    print(f"[PASS] Q2 Answer Evaluated: Score={ans2_data['score']}/10")

    # 9. Request Q3
    q3_res = client.post(f"/api/interviews/{interview_id}/next-question", headers=headers)
    assert q3_res.status_code == 200
    q3 = q3_res.json()
    print(f"[PASS] Q3 Generated (#{q3['question_number']}): {q3['question_text']}")

    # 10. Submit answer to Q3
    q3_answer = "Convolutional filters perform element-wise matrix dot products over local spatial receptive fields, followed by pooling and activation functions."
    ans3_res = client.post(
        f"/api/interviews/{interview_id}/answer?question_id={q3['id']}",
        json={"answer_text": q3_answer},
        headers=headers
    )
    assert ans3_res.status_code == 200
    print("[PASS] Q3 Answer Evaluated")

    # 11. Complete interview and get final report
    comp_res = client.post(f"/api/interviews/{interview_id}/complete", headers=headers)
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    print(f"[PASS] Interview Completed: Overall Score = {comp_data['overall_score']}%")
    print(f"       Technical Score = {comp_data['technical_score']}%, Clarity = {comp_data['clarity_score']}%")
    print(f"       Summary: {comp_data['summary']}")
    assert len(comp_data["strengths"]) > 0
    assert len(comp_data["weaknesses"]) > 0

    # 12. Test Individual Question Download
    dl_q_res = client.get(f"/api/interviews/{interview_id}/questions/{q1['id']}/download", headers=headers)
    assert dl_q_res.status_code == 200
    assert "AI INTERVIEW ASSISTANT" in dl_q_res.text
    assert "Question 1" in dl_q_res.text
    assert "Candidate Answer:" in dl_q_res.text
    print("[PASS] Individual question report download verified")

    # 13. Test Full Interview Download
    dl_full_res = client.get(f"/api/interviews/{interview_id}/download", headers=headers)
    assert dl_full_res.status_code == 200
    assert "OFFICIAL CANDIDATE REPORT" in dl_full_res.text
    assert "EVALUATION METRICS" in dl_full_res.text
    assert "Dr. A V S Pavan Kumar" in dl_full_res.text
    assert "Group" in dl_full_res.text and "18" in dl_full_res.text
    assert "AIML-B" in dl_full_res.text
    print("[PASS] Full interview text report download verified")

    # 14. Test PDF Resume Upload & Parsing
    # Create a synthetic PDF in memory with pypdf
    writer = pypdf.PdfWriter()
    page = writer.add_blank_page(width=612, height=792)
    pdf_buffer = io.BytesIO()
    writer.write(pdf_buffer)
    pdf_bytes = pdf_buffer.getvalue()

    upload_res = client.post(
        "/api/resume/upload",
        files={"file": ("resume.pdf", pdf_bytes, "application/pdf")},
        headers=headers
    )
    assert upload_res.status_code == 200
    upload_data = upload_res.json()
    assert "analysis" in upload_data
    assert "skills" in upload_data["analysis"]
    print(f"[PASS] Resume PDF upload & analysis verified: Detected {len(upload_data['analysis']['skills'])} skills")

    # 15. Test Progress Analytics
    prog_res = client.get("/api/progress", headers=headers)
    assert prog_res.status_code == 200
    prog_data = prog_res.json()
    assert prog_data["interviews_completed"] >= 1
    assert prog_data["questions_answered"] >= 3
    print(f"[PASS] Progress metrics verified: Total={prog_data['interviews_completed']}, Answered={prog_data['questions_answered']}")

    print("=== ALL 15 AUTOMATED VERIFICATION CHECKS PASSED WITH ZERO ERRORS! ===")

if __name__ == "__main__":
    run_tests()
