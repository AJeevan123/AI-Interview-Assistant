from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class InterviewCreate(BaseModel):
    role: str = Field(..., description="Target job role, e.g. 'AI / ML Engineer', 'Python Developer'")
    interview_type: str = Field("Technical", description="'Technical', 'HR', 'Behavioral', 'Mixed'")
    difficulty: str = Field("Medium", description="'Easy', 'Medium', 'Hard'")
    question_count: int = Field(5, ge=1, le=25, description="Number of questions in session")
    resume_text: Optional[str] = None
    jd_text: Optional[str] = None

class QuestionOut(BaseModel):
    id: str
    interview_id: str
    question_number: int
    question_text: str
    question_type: str = "Technical"
    topic: Optional[str] = "Core Concepts"
    difficulty: str = "Medium"
    is_follow_up: int = 0
    parent_question_id: Optional[str] = None

class AnswerSubmit(BaseModel):
    question_id: Optional[str] = None
    question_number: Optional[int] = None
    question_text: Optional[str] = None
    candidate_answer: Optional[str] = None
    answer_text: Optional[str] = None
    role: Optional[str] = None
    interview_type: Optional[str] = None
    difficulty: Optional[str] = None
    topic: Optional[str] = None

    def get_answer_text(self) -> str:
        text = self.answer_text or self.candidate_answer or ""
        return text.strip()

class AnswerOut(BaseModel):
    id: str
    question_id: str
    interview_id: str
    answer_text: str
    score: float
    feedback: str
    technical_score: float = 0.0
    relevance_score: float = 0.0
    clarity_score: float = 0.0
    completeness_score: float = 0.0
    problem_solving_score: float = 0.0
    missing_concepts: List[str] = []
    improvement_suggestions: List[str] = []
    ideal_answer: Optional[str] = ""
    strengths: List[str] = []
    areas_to_improve: List[str] = []
    follow_up_required: bool = False
    follow_up_question: Optional[QuestionOut] = None
    is_demo_mode: bool = False

class QuestionAnswerDetail(BaseModel):
    question: QuestionOut
    answer: Optional[AnswerOut] = None

class InterviewDetail(BaseModel):
    id: str
    user_id: str
    role: str
    interview_type: str
    difficulty: str
    question_count: int
    overall_score: float = 0.0
    technical_score: float = 0.0
    clarity_score: float = 0.0
    relevance_score: float = 0.0
    completeness_score: float = 0.0
    status: str = "in_progress"
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    summary: Optional[str] = ""
    strengths: List[str] = []
    weaknesses: List[str] = []
    recommendations: List[str] = []
    questions: List[QuestionAnswerDetail] = []

class InterviewSummaryItem(BaseModel):
    id: str
    role: str
    interview_type: str
    difficulty: str
    question_count: int
    overall_score: Optional[float] = 0.0
    status: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    created_at: Optional[str] = None
