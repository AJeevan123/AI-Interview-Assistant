import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status
from app.database import get_database
from app.services.ai_service import AIService
from app.schemas.interview import (
    InterviewCreate, InterviewDetail, QuestionOut, AnswerOut,
    QuestionAnswerDetail, InterviewSummaryItem
)

class InterviewService:
    @staticmethod
    def create_interview(user_id: str, payload: InterviewCreate) -> Dict[str, Any]:
        """Creates a new interview session in MongoDB and generates question #1."""
        db = get_database()
        interview_id = f"int_{uuid.uuid4().hex[:12]}"
        q_id = f"q_{uuid.uuid4().hex[:12]}"
        now_iso = datetime.now(timezone.utc).isoformat()

        # Generate question #1 via Gemini / AI service
        first_q = AIService.generate_first_question(
            role=payload.role,
            interview_type=payload.interview_type,
            difficulty=payload.difficulty,
            resume_text=payload.resume_text,
            jd_text=payload.jd_text
        )

        initial_question = {
            "id": q_id,
            "interview_id": interview_id,
            "question_number": 1,
            "question_text": first_q["question"],
            "question_type": first_q.get("question_type", payload.interview_type),
            "topic": first_q.get("topic", f"{payload.role} Core"),
            "difficulty": payload.difficulty,
            "is_follow_up": 0,
            "parent_question_id": None,
            "answer": None,
            "created_at": now_iso
        }

        interview_doc = {
            "id": interview_id,
            "user_id": user_id,
            "role": payload.role,
            "interview_type": payload.interview_type,
            "difficulty": payload.difficulty,
            "question_count": payload.question_count,
            "resume_text": payload.resume_text,
            "jd_text": payload.jd_text,
            "status": "in_progress",
            "overall_score": 0.0,
            "technical_score": 0.0,
            "clarity_score": 0.0,
            "relevance_score": 0.0,
            "completeness_score": 0.0,
            "summary": "",
            "strengths": [],
            "weaknesses": [],
            "recommendations": [],
            "questions": [initial_question],
            "start_time": now_iso,
            "end_time": None,
            "created_at": now_iso,
            "updated_at": now_iso
        }

        db.interviews.insert_one(interview_doc)

        return {
            "interview_id": interview_id,
            "id": interview_id,
            "role": payload.role,
            "interview_type": payload.interview_type,
            "difficulty": payload.difficulty,
            "question_count": payload.question_count,
            "current_question": QuestionOut(**initial_question).model_dump()
        }

    @staticmethod
    def list_user_interviews(user_id: str) -> List[InterviewSummaryItem]:
        """Lists all interviews for the specified user from MongoDB, sorted newest first."""
        db = get_database()
        cursor = db.interviews.find({"user_id": user_id}).sort("created_at", -1)
        results = []
        for doc in cursor:
            results.append(InterviewSummaryItem(
                id=doc["id"],
                role=doc["role"],
                interview_type=doc["interview_type"],
                difficulty=doc["difficulty"],
                question_count=doc["question_count"],
                overall_score=doc.get("overall_score", 0.0),
                status=doc.get("status", "in_progress"),
                start_time=doc.get("start_time"),
                end_time=doc.get("end_time"),
                created_at=doc.get("created_at")
            ))
        return results

    @staticmethod
    def get_interview(interview_id: str, user_id: str) -> InterviewDetail:
        """Fetches full interview details including questions and evaluations, ensuring user authorization."""
        db = get_database()
        doc = db.interviews.find_one({"id": interview_id, "user_id": user_id})
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Interview session not found or access denied."
            )

        q_and_a_list = []
        for q in doc.get("questions", []):
            q_out = QuestionOut(
                id=q["id"],
                interview_id=doc["id"],
                question_number=q["question_number"],
                question_text=q["question_text"],
                question_type=q.get("question_type", doc["interview_type"]),
                topic=q.get("topic", "Core Concepts"),
                difficulty=q.get("difficulty", doc["difficulty"]),
                is_follow_up=q.get("is_follow_up", 0),
                parent_question_id=q.get("parent_question_id")
            )
            ans_data = q.get("answer")
            ans_out = AnswerOut(**ans_data) if ans_data else None
            q_and_a_list.append(QuestionAnswerDetail(question=q_out, answer=ans_out))

        return InterviewDetail(
            id=doc["id"],
            user_id=doc["user_id"],
            role=doc["role"],
            interview_type=doc["interview_type"],
            difficulty=doc["difficulty"],
            question_count=doc["question_count"],
            overall_score=doc.get("overall_score", 0.0),
            technical_score=doc.get("technical_score", 0.0),
            clarity_score=doc.get("clarity_score", 0.0),
            relevance_score=doc.get("relevance_score", 0.0),
            completeness_score=doc.get("completeness_score", 0.0),
            status=doc.get("status", "in_progress"),
            start_time=doc.get("start_time"),
            end_time=doc.get("end_time"),
            summary=doc.get("summary", ""),
            strengths=doc.get("strengths", []),
            weaknesses=doc.get("weaknesses", []),
            recommendations=doc.get("recommendations", []),
            questions=q_and_a_list
        )

    @staticmethod
    def submit_answer(
        interview_id: str,
        question_id: str,
        user_id: str,
        ans_text: str,
        payload_meta: Dict[str, Any]
    ) -> AnswerOut:
        """Evaluates an answer independently and updates MongoDB with the evaluation."""
        db = get_database()
        doc = db.interviews.find_one({"id": interview_id, "user_id": user_id})
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Interview session not found or unauthorized."
            )

        # Locate question in interview
        target_q = None
        for q in doc.get("questions", []):
            if q["id"] == question_id:
                target_q = q
                break

        if not target_q:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Question '{question_id}' not found in this interview session."
            )

        # Perform independent evaluation
        eval_result = AIService.evaluate_answer(
            question_text=target_q["question_text"],
            answer_text=ans_text,
            role=doc["role"],
            difficulty=target_q.get("difficulty", doc["difficulty"]),
            topic=target_q.get("topic", "Concepts"),
            interview_type=doc["interview_type"],
            interview_id=interview_id,
            question_id=question_id,
            question_number=target_q.get("question_number", 1)
        )

        ans_id = f"ans_{uuid.uuid4().hex[:12]}"
        now_iso = datetime.now(timezone.utc).isoformat()

        answer_obj = {
            "id": ans_id,
            "question_id": question_id,
            "interview_id": interview_id,
            "answer_text": ans_text,
            "score": eval_result["score"],
            "feedback": eval_result["feedback"],
            "technical_score": eval_result["technical_accuracy"],
            "relevance_score": eval_result["relevance"],
            "clarity_score": eval_result["clarity"],
            "completeness_score": eval_result["completeness"],
            "problem_solving_score": eval_result["problem_solving"],
            "missing_concepts": eval_result.get("missing_concepts", []),
            "improvement_suggestions": eval_result.get("improvement_suggestions", []),
            "ideal_answer": eval_result.get("ideal_answer", ""),
            "strengths": eval_result.get("strengths", []),
            "areas_to_improve": eval_result.get("areas_to_improve", []),
            "follow_up_required": eval_result.get("follow_up_required", False),
            "follow_up_question": None,
            "is_demo_mode": eval_result.get("is_demo_mode", False),
            "created_at": now_iso
        }

        # Follow-up question generation if triggered (maximum 1 follow up per question)
        follow_up_out = None
        if eval_result.get("follow_up_required") and not target_q.get("is_follow_up"):
            existing_fus = sum(1 for q in doc.get("questions", []) if q.get("is_follow_up"))
            if existing_fus < 2:
                fu_text = eval_result.get("follow_up_question") or f"Could you provide a concrete architectural example or edge-case handling for {target_q['topic']}?"
                fu_id = f"q_fu_{uuid.uuid4().hex[:12]}"
                fu_q = {
                    "id": fu_id,
                    "interview_id": interview_id,
                    "question_number": target_q["question_number"],
                    "question_text": fu_text,
                    "question_type": target_q["question_type"],
                    "topic": f"Follow-up: {target_q['topic']}",
                    "difficulty": target_q["difficulty"],
                    "is_follow_up": 1,
                    "parent_question_id": question_id,
                    "answer": None,
                    "created_at": now_iso
                }
                db.interviews.update_one(
                    {"id": interview_id},
                    {"$push": {"questions": fu_q}}
                )
                follow_up_out = QuestionOut(**fu_q)
                answer_obj["follow_up_question"] = follow_up_out.model_dump()

        # Update specific question's answer in MongoDB array
        db.interviews.update_one(
            {"id": interview_id, "questions.id": question_id},
            {
                "$set": {
                    "questions.$.answer": answer_obj,
                    "updated_at": now_iso
                }
            }
        )

        return AnswerOut(**answer_obj)

    @staticmethod
    def get_next_question(interview_id: str, user_id: str) -> Optional[QuestionOut]:
        """Generates the next question in the session or returns None when quota is reached."""
        db = get_database()
        doc = db.interviews.find_one({"id": interview_id, "user_id": user_id})
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Interview session not found."
            )

        questions = doc.get("questions", [])
        main_questions = [q for q in questions if not q.get("is_follow_up")]
        current_count = len(main_questions)

        if current_count >= doc.get("question_count", 5):
            return None

        # Build conversation history
        prev_qa = []
        for q in questions:
            if q.get("answer"):
                prev_qa.append({
                    "question": q["question_text"],
                    "answer": q["answer"]["answer_text"]
                })

        next_q_data = AIService.generate_next_question(
            role=doc["role"],
            interview_type=doc["interview_type"],
            difficulty=doc["difficulty"],
            previous_qa=prev_qa,
            question_index=current_count,
            resume_text=doc.get("resume_text"),
            jd_text=doc.get("jd_text")
        )

        q_id = f"q_{uuid.uuid4().hex[:12]}"
        now_iso = datetime.now(timezone.utc).isoformat()
        new_q_number = current_count + 1

        new_q = {
            "id": q_id,
            "interview_id": interview_id,
            "question_number": new_q_number,
            "question_text": next_q_data["question"],
            "question_type": next_q_data.get("question_type", doc["interview_type"]),
            "topic": next_q_data.get("topic", f"{doc['role']} Advanced"),
            "difficulty": doc["difficulty"],
            "is_follow_up": 0,
            "parent_question_id": None,
            "answer": None,
            "created_at": now_iso
        }

        db.interviews.update_one(
            {"id": interview_id},
            {
                "$push": {"questions": new_q},
                "$set": {"updated_at": now_iso}
            }
        )

        return QuestionOut(**new_q)

    @staticmethod
    def complete_interview(interview_id: str, user_id: str, candidate_name: str = "Candidate") -> InterviewDetail:
        """Finalizes the interview, generates comprehensive AI performance report, and writes to MongoDB."""
        db = get_database()
        doc = db.interviews.find_one({"id": interview_id, "user_id": user_id})
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Interview session not found."
            )

        answered = []
        for q in doc.get("questions", []):
            if q.get("answer"):
                ans = q["answer"]
                answered.append({
                    "question_text": q["question_text"],
                    "answer_text": ans["answer_text"],
                    "score": ans["score"],
                    "technical_score": ans.get("technical_score", ans["score"]),
                    "clarity_score": ans.get("clarity_score", ans["score"]),
                    "relevance_score": ans.get("relevance_score", ans["score"]),
                    "completeness_score": ans.get("completeness_score", ans["score"])
                })

        report = AIService.generate_final_report(
            role=doc["role"],
            interview_type=doc["interview_type"],
            difficulty=doc["difficulty"],
            questions_and_answers=answered,
            candidate_name=candidate_name
        )

        now_iso = datetime.now(timezone.utc).isoformat()

        # Update interview record
        update_fields = {
            "overall_score": report["overall_score"],
            "technical_score": report["technical_score"],
            "clarity_score": report["clarity_score"],
            "relevance_score": report["relevance_score"],
            "completeness_score": report["completeness_score"],
            "summary": report["summary"],
            "strengths": report["strengths"],
            "weaknesses": report["weaknesses"],
            "recommendations": report["recommendations"],
            "status": "completed",
            "end_time": now_iso,
            "updated_at": now_iso
        }

        db.interviews.update_one({"id": interview_id}, {"$set": update_fields})

        # Save to interview_reports collection as well
        report_doc = {
            "id": f"rep_{interview_id}",
            "interview_id": interview_id,
            "user_id": user_id,
            "candidate_name": candidate_name,
            "role": doc["role"],
            "difficulty": doc["difficulty"],
            "overall_score": report["overall_score"],
            "breakdown": {
                "technical": report["technical_score"],
                "clarity": report["clarity_score"],
                "relevance": report["relevance_score"],
                "completeness": report["completeness_score"]
            },
            "summary": report["summary"],
            "strengths": report["strengths"],
            "weaknesses": report["weaknesses"],
            "recommendations": report["recommendations"],
            "questions_and_answers": answered,
            "created_at": now_iso
        }
        db.interview_reports.update_one(
            {"interview_id": interview_id},
            {"$set": report_doc},
            upsert=True
        )

        return InterviewService.get_interview(interview_id, user_id)

    @staticmethod
    def delete_interview(interview_id: str, user_id: str) -> bool:
        """Deletes an interview session and its report, enforcing user-level isolation."""
        db = get_database()
        res = db.interviews.delete_one({"id": interview_id, "user_id": user_id})
        if res.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Interview session not found or unauthorized."
            )
        db.interview_reports.delete_one({"interview_id": interview_id, "user_id": user_id})
        return True
