from pydantic import BaseModel
from typing import List, Optional

class EvaluationResult(BaseModel):
    score: float
    relevance: float
    technical_accuracy: float
    clarity: float
    completeness: float
    feedback: str
    strengths: List[str] = []
    areas_to_improve: List[str] = []
    follow_up_required: bool = False
    follow_up_question: Optional[str] = None
    is_demo_mode: bool = False

class FinalReport(BaseModel):
    overall_score: float
    technical_score: float
    clarity_score: float
    relevance_score: float
    completeness_score: float
    summary: str
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[str]

class ResumeAnalysis(BaseModel):
    skills: List[str]
    technologies: List[str]
    projects: List[str]
    education: List[str]
    experience_summary: str
    recommended_questions: List[str]

class ProgressStats(BaseModel):
    interviews_completed: int
    average_score: float
    best_score: float
    questions_answered: int
    current_streak: int
    technical_average: float
    clarity_average: float
    relevance_average: float
    completeness_average: float
    history: List[dict]
