from fastapi import APIRouter, HTTPException, status, Depends, Response
from typing import List, Optional
from datetime import datetime
from app.utils.dependencies import get_current_user
from app.services.interview_service import InterviewService
from app.services.report_service import ReportService
from app.schemas.interview import (
    InterviewCreate, InterviewDetail, QuestionOut, AnswerSubmit,
    AnswerOut, InterviewSummaryItem
)

router = APIRouter(prefix="/api/interviews", tags=["Interviews"])

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
@router.post("/start", response_model=dict, status_code=status.HTTP_201_CREATED)
def start_interview(payload: InterviewCreate, current_user: dict = Depends(get_current_user)):
    """Initializes a new mock interview session and returns question #1."""
    return InterviewService.create_interview(
        user_id=current_user["id"],
        payload=payload
    )

@router.get("", response_model=List[InterviewSummaryItem])
@router.get("/history", response_model=List[InterviewSummaryItem])
def list_interviews(current_user: dict = Depends(get_current_user)):
    """Lists all past interviews for the authenticated user."""
    return InterviewService.list_user_interviews(user_id=current_user["id"])

@router.get("/{interview_id}", response_model=InterviewDetail)
def get_interview(interview_id: str, current_user: dict = Depends(get_current_user)):
    """Retrieves full interview details, questions, answers, and evaluations."""
    return InterviewService.get_interview(
        interview_id=interview_id,
        user_id=current_user["id"]
    )

@router.post("/{interview_id}/answer", response_model=AnswerOut)
def submit_answer(
    interview_id: str,
    payload: AnswerSubmit,
    question_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Submits and evaluates an answer independently based on technical rubric."""
    q_id = question_id or payload.question_id
    if not q_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="question_id parameter is required."
        )

    ans_text = payload.get_answer_text()
    if not ans_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide an answer before submitting."
        )

    return InterviewService.submit_answer(
        interview_id=interview_id,
        question_id=q_id,
        user_id=current_user["id"],
        ans_text=ans_text,
        payload_meta=payload.model_dump()
    )

@router.post("/{interview_id}/next-question", response_model=Optional[QuestionOut])
def get_next_question(interview_id: str, current_user: dict = Depends(get_current_user)):
    """Generates the next question or returns None when all questions are answered."""
    return InterviewService.get_next_question(
        interview_id=interview_id,
        user_id=current_user["id"]
    )

@router.post("/{interview_id}/complete", response_model=InterviewDetail)
def complete_interview(interview_id: str, current_user: dict = Depends(get_current_user)):
    """Finalizes the interview session, computes composite scores, and compiles evaluation."""
    return InterviewService.complete_interview(
        interview_id=interview_id,
        user_id=current_user["id"],
        candidate_name=current_user.get("name", "Candidate")
    )

@router.delete("/{interview_id}", status_code=status.HTTP_200_OK)
def delete_interview(interview_id: str, current_user: dict = Depends(get_current_user)):
    """Deletes an interview session belonging to the authenticated user."""
    InterviewService.delete_interview(
        interview_id=interview_id,
        user_id=current_user["id"]
    )
    return {"message": "Interview session deleted successfully", "id": interview_id}

@router.get("/{interview_id}/download")
def download_full_report(interview_id: str, current_user: dict = Depends(get_current_user)):
    """Generates and streams plain-text interview report for frontend download button."""
    detail = InterviewService.get_interview(interview_id=interview_id, user_id=current_user["id"])
    text_content = ReportService.generate_full_report_download_text(
        detail=detail.model_dump(),
        candidate_name=current_user.get("name", "Candidate")
    )
    date_tag = datetime.now().strftime("%Y%m%d_%H%M")
    filename = f"AI_Interview_Report_{date_tag}.txt"
    return Response(
        content=text_content,
        media_type="text/plain; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/{interview_id}/questions/{question_id}/download")
def download_single_question(
    interview_id: str,
    question_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Generates single-question text download matching frontend DownloadButton."""
    detail = InterviewService.get_interview(interview_id=interview_id, user_id=current_user["id"])
    target_q = None
    target_ans = None
    for q_item in detail.questions:
        if q_item.question.id == question_id:
            target_q = q_item.question
            target_ans = q_item.answer
            break

    if not target_q:
        raise HTTPException(status_code=404, detail="Question not found.")

    text_content = ReportService.generate_question_download_text(
        question_number=target_q.question_number,
        question_text=target_q.question_text,
        answer_text=target_ans.answer_text if target_ans else "No answer recorded",
        feedback=target_ans.feedback if target_ans else "Not evaluated",
        score=target_ans.score if target_ans else 0.0,
        date_str=datetime.now().strftime("%Y-%m-%d"),
        role=detail.role
    )
    filename = f"AI_Interview_Question_{target_q.question_number:02d}.txt"
    return Response(
        content=text_content,
        media_type="text/plain; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
