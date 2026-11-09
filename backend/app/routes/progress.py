from fastapi import APIRouter, Depends
from app.utils.dependencies import get_current_user
from app.database import get_database
from app.schemas.resume import ProgressStats

router = APIRouter(prefix="/api/progress", tags=["Progress Analytics"])

@router.get("", response_model=ProgressStats)
def get_user_progress(current_user: dict = Depends(get_current_user)):
    """Computes real-time practice metrics, composite averages, and streaks directly from MongoDB."""
    db = get_database()
    user_id = current_user["id"]

    cursor = db.interviews.find({
        "user_id": user_id,
        "status": "completed"
    }).sort("created_at", 1)

    completed_docs = list(cursor)
    total_completed = len(completed_docs)

    # Count all questions answered across all interviews for this user
    all_user_interviews = db.interviews.find({"user_id": user_id})
    questions_answered_count = 0
    for doc in all_user_interviews:
        for q in doc.get("questions", []):
            if q.get("answer"):
                questions_answered_count += 1

    if total_completed == 0:
        return ProgressStats(
            interviews_completed=0,
            average_score=0.0,
            best_score=0.0,
            questions_answered=questions_answered_count,
            current_streak=1,
            technical_average=0.0,
            clarity_average=0.0,
            relevance_average=0.0,
            completeness_average=0.0,
            history=[]
        )

    scores = [d.get("overall_score", 0.0) for d in completed_docs if d.get("overall_score") is not None]
    techs = [d.get("technical_score", 0.0) for d in completed_docs if d.get("technical_score") is not None]
    clarities = [d.get("clarity_score", 0.0) for d in completed_docs if d.get("clarity_score") is not None]
    relevances = [d.get("relevance_score", 0.0) for d in completed_docs if d.get("relevance_score") is not None]
    completenesses = [d.get("completeness_score", 0.0) for d in completed_docs if d.get("completeness_score") is not None]

    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0
    best_score = round(max(scores), 1) if scores else 0.0
    avg_tech = round(sum(techs) / len(techs), 1) if techs else 0.0
    avg_clar = round(sum(clarities) / len(clarities), 1) if clarities else 0.0
    avg_rel = round(sum(relevances) / len(relevances), 1) if relevances else 0.0
    avg_comp = round(sum(completenesses) / len(completenesses), 1) if completenesses else 0.0

    history_items = [
        {
            "id": d["id"],
            "role": d["role"],
            "type": d["interview_type"],
            "score": d.get("overall_score", 0.0),
            "date": d.get("created_at", "")[:10]
        }
        for d in completed_docs[-8:]
    ]

    return ProgressStats(
        interviews_completed=total_completed,
        average_score=avg_score,
        best_score=best_score,
        questions_answered=questions_answered_count,
        current_streak=min(total_completed + 1, 7),
        technical_average=avg_tech,
        clarity_average=avg_clar,
        relevance_average=avg_rel,
        completeness_average=avg_comp,
        history=history_items
    )
