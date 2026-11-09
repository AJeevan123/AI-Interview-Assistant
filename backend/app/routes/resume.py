from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, status
from typing import Optional, List, Dict, Any
from app.utils.dependencies import get_current_user
from app.services.resume_service import ResumeService
from app.schemas.resume import ResumeAnalysis, ResumeUploadResponse
from app.database import get_database

router = APIRouter(prefix="/api/resume", tags=["Resume Intelligence"])

@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(
    file: UploadFile = File(...),
    target_role: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Processes uploaded resume in PDF or DOCX format, extracts candidate data, and stores analysis."""
    filename = file.filename or "resume.pdf"
    ext = filename.lower().split(".")[-1] if "." in filename else ""
    
    if ext not in ["pdf", "docx"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload a PDF (.pdf) or Word document (.docx)."
        )
    
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum limit of 10MB."
        )

    if ext == "pdf":
        extracted_text = ResumeService.extract_text_from_pdf(content)
    else:
        extracted_text = ResumeService.extract_text_from_docx(content)

    if not extracted_text or len(extracted_text.strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to extract text from this document. Please verify the document contains readable text."
        )

    analysis_data = ResumeService.analyze_resume_content(
        text=extracted_text,
        user_id=current_user["id"],
        filename=filename,
        target_role=target_role
    )

    return ResumeUploadResponse(
        filename=filename,
        extracted_text=extracted_text,
        character_count=len(extracted_text),
        analysis=ResumeAnalysis(**analysis_data)
    )

@router.post("/analyze", response_model=ResumeAnalysis)
def analyze_resume_text(
    resume_text: str = Form(...),
    target_role: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Analyzes raw resume text directly."""
    if not resume_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume text cannot be empty."
        )
    analysis_data = ResumeService.analyze_resume_content(
        text=resume_text,
        user_id=current_user["id"],
        filename="text_input.txt",
        target_role=target_role
    )
    return ResumeAnalysis(**analysis_data)

@router.get("/history", response_model=List[Dict[str, Any]])
def get_resume_history(current_user: dict = Depends(get_current_user)):
    """Retrieves previous resume analyses conducted by the user from MongoDB."""
    db = get_database()
    cursor = db.resume_analyses.find({"user_id": current_user["id"]}).sort("created_at", -1)
    results = []
    for doc in cursor:
        results.append({
            "id": doc["id"],
            "filename": doc.get("filename", "resume.pdf"),
            "skills": doc.get("analysis", {}).get("skills", []),
            "relevance_score": doc.get("analysis", {}).get("role_relevance_score", 0.0),
            "created_at": doc.get("created_at")
        })
    return results

@router.post("/jd/analyze")
def analyze_job_description(
    jd_text: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Extracts required competencies, frameworks, and qualifications from a Job Description."""
    if not jd_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description text cannot be empty."
        )

    common_reqs = ["python", "react", "javascript", "java", "sql", "fastapi", "docker", "aws", "git", "rest", "machine learning"]
    detected = [req.title() for req in common_reqs if req in jd_text.lower()]
    return {
        "identified_competencies": detected or ["Software Engineering", "Full-Stack Development"],
        "word_count": len(jd_text.split()),
        "summary": "Job description parsed successfully. Practice questions will target these competencies."
    }
