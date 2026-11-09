from fastapi import APIRouter, HTTPException, Depends, Response, status
from typing import Dict, Any
from app.utils.dependencies import get_current_user
from app.services.interview_service import InterviewService
from app.services.report_service import ReportService
from app.database import get_database

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/{report_id}")
def get_report(report_id: str, current_user: dict = Depends(get_current_user)):
    """Retrieves an interview performance report by ID or interview ID."""
    db = get_database()
    # Normalize ID if passed as interview ID
    int_id = report_id.replace("rep_", "")
    report = db.interview_reports.find_one({
        "$or": [{"id": report_id}, {"interview_id": int_id}],
        "user_id": current_user["id"]
    })

    if not report:
        # Fallback to generating on the fly from interview record
        detail = InterviewService.get_interview(interview_id=int_id, user_id=current_user["id"])
        return {
            "id": f"rep_{int_id}",
            "interview_id": int_id,
            "candidate_name": current_user.get("name", "Candidate"),
            "role": detail.role,
            "difficulty": detail.difficulty,
            "overall_score": detail.overall_score,
            "breakdown": {
                "technical": detail.technical_score,
                "clarity": detail.clarity_score,
                "relevance": detail.relevance_score,
                "completeness": detail.completeness_score
            },
            "summary": detail.summary,
            "strengths": detail.strengths,
            "weaknesses": detail.weaknesses,
            "recommendations": detail.recommendations,
            "questions_and_answers": [
                {
                    "question_text": q.question.question_text,
                    "answer_text": q.answer.answer_text if q.answer else "No answer",
                    "score": q.answer.score if q.answer else 0.0,
                    "feedback": q.answer.feedback if q.answer else ""
                }
                for q in detail.questions
            ]
        }

    # Remove MongoDB internal ObjectId
    report.pop("_id", None)
    return report

@router.get("/{report_id}/download")
def download_pdf_report(report_id: str, current_user: dict = Depends(get_current_user)):
    """Generates and streams an executive PDF report built with ReportLab."""
    int_id = report_id.replace("rep_", "")
    detail = InterviewService.get_interview(interview_id=int_id, user_id=current_user["id"])
    
    pdf_bytes = ReportService.generate_pdf_report(
        interview_detail=detail.model_dump(),
        candidate_name=current_user.get("name", "Candidate")
    )
    
    filename = f"AI_Interview_Report_{int_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
