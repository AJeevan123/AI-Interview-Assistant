from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ResumeAnalysis(BaseModel):
    skills: List[str] = []
    technologies: List[str] = []
    experience_summary: str = ""
    education: List[str] = []
    projects: List[str] = []
    recommended_questions: List[str] = []
    candidate_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    certifications: List[str] = []
    work_experience: List[str] = []
    missing_skills: List[str] = []
    strengths: List[str] = []
    weaknesses: List[str] = []
    improvement_suggestions: List[str] = []
    role_relevance_score: float = 0.0

class ResumeUploadResponse(BaseModel):
    filename: str
    extracted_text: str
    character_count: int
    analysis: ResumeAnalysis

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
    history: List[Dict[str, Any]] = []
