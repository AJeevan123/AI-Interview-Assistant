# AI INTERVIEW COACH

> **Interactive Full-Stack AI Mock Interview Platform**  
> **Supervisor**: Dr. A V S Pavan Kumar | **Department & Section**: AIML-B | **Group**: 18  
> **Team Members**:
> - **D. ABHAY** — Roll No: `24CSEAIML243` | Reg No: `24UG010737`
> - **KORADA SRAVANTH KUMAR** — Roll No: `24CSEAIML256` | Reg No: `24UG010749`
> - **KODI JANAKI RAO** — Roll No: `24CSEAIML261` | Reg No: `24UG010753`

---

## 1. Project Overview

**AI Interview Coach** is a production-ready, full-stack web application designed to help students and software engineers prepare for technical, HR, behavioral, and mixed job interviews. It simulates realistic interview conversations, dynamically presents questions according to target role and difficulty, accepts typed or speech-recognized answers, independently scores each answer based on a strict 4-criteria rubric, and produces executive PDF and text performance reports.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS + `@tailwindcss/vite`
- **Routing**: React Router v7
- **Icons**: Lucide React
- **Animations**: Framer Motion & Canvas Confetti
- **Proxy**: Vite proxy mapping `/api/*` to `http://127.0.0.1:8000/api/*`

### Backend
- **Language**: Python 3.11+ / Python 3.14
- **Framework**: FastAPI + Uvicorn ASGI Server
- **Database**: MongoDB (via `pymongo`)
- **Authentication**: JWT (`pyjwt`) with Bcrypt password hashing
- **Document Processing**:
  - `pymupdf` (PDF extraction)
  - `python-docx` (Word document extraction)
- **PDF Report Generation**: `reportlab`
- **AI Integration**: Google Gemini API (`gemini-1.5-flash` / `gemini-2.0-flash`) with structured JSON schema output and intelligent heuristic rubric fallback engine.

---

## 3. Database Architecture (MongoDB)

Database Name: `ai_interview_coach`

| Collection | Description | Primary Indexes |
|---|---|---|
| `users` | Candidate accounts with bcrypt password hashes | `email` (unique), `id` (unique) |
| `interviews` | Active and historical interview sessions, embedded questions, answers, and rubric evaluations | `id` (unique), `user_id`, `created_at` |
| `interview_reports` | Compiled comprehensive reports with category breakdowns, strengths, and weaknesses | `interview_id` (unique), `user_id`, `created_at` |
| `resume_analyses` | Parsed resume data, skills extracted, missing skills, and recommended questions | `id` (unique), `user_id`, `created_at` |

---

## 4. Evaluation Rubric

Every candidate answer is evaluated **independently** on a 0–10 scale based on the weighted formula:
$$\text{Question Score} = 0.40 \times \text{Technical Correctness} + 0.25 \times \text{Relevance} + 0.20 \times \text{Clarity} + 0.15 \times \text{Problem Solving}$$

Composite Interview Score (0–100%):
$$\text{Overall Score} = \text{Average}(\text{Question Scores}) \times 10$$

---

## 5. Quick Start (Windows)

### Method A: One-Click Runner (Recommended)
Double-click `run.bat` in the project root directory. This script will:
1. Verify MongoDB is running.
2. Launch the FastAPI backend on `http://localhost:8000`.
3. Launch the React frontend on `http://localhost:5173`.
4. Automatically open your browser to `http://localhost:5173`.

To stop both servers cleanly, double-click `stop.bat`.

---

### Method B: Manual Execution

#### 1. Start MongoDB
Ensure MongoDB service is running:
```powershell
net start MongoDB
```

#### 2. Start the Backend
```powershell
cd backend
# Create and activate virtual environment (if not already done)
py -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive API documentation will be available at: `http://localhost:8000/docs`

#### 3. Start the Frontend
In a separate terminal window:
```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```
Open `http://localhost:5173` in your browser.

---

## 6. Environment Variables (`backend/.env`)

Copy `.env.example` to `.env`:
```ini
# Server Configuration
HOST=127.0.0.1
PORT=8000
ENVIRONMENT=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/
DATABASE_NAME=ai_interview_coach

# JWT Security
SECRET_KEY=ai-interview-coach-super-secret-jwt-key-production-grade-2026
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Google Gemini API Configuration (Optional)
# Obtain from https://aistudio.google.com/app/apikey
# If left empty, the intelligent heuristic fallback engine evaluates answers without failing.
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash

# Storage
UPLOAD_DIR=uploads
```

---

## 7. REST API Endpoints

### Authentication
- `POST /api/auth/register` — Register a new account
- `POST /api/auth/login` — Authenticate and obtain JWT token
- `GET  /api/auth/me` — Get active candidate profile
- `POST /api/auth/logout` — End session

### Interviews
- `POST /api/interviews/start` (or `POST /api/interviews`) — Create session & get question #1
- `GET  /api/interviews/history` (or `GET /api/interviews`) — List user interview sessions
- `GET  /api/interviews/{id}` — Get interview details, questions, and scores
- `POST /api/interviews/{id}/answer` — Submit answer & receive independent evaluation
- `POST /api/interviews/{id}/next-question` — Generate subsequent question
- `POST /api/interviews/{id}/complete` — Finalize interview and generate report
- `DELETE /api/interviews/{id}` — Delete interview record
- `GET  /api/interviews/{id}/download` — Download plain-text interview transcript
- `GET  /api/interviews/{id}/questions/{qid}/download` — Download single question transcript

### Resume Intelligence
- `POST /api/resume/upload` — Upload PDF/DOCX resume for parsing & skill extraction
- `POST /api/resume/analyze` — Analyze raw resume text
- `GET  /api/resume/history` — Get past uploaded resume summaries
- `POST /api/resume/jd/analyze` — Extract target competencies from Job Description

### Reports & Analytics
- `GET /api/reports/{id}` — Fetch structured report data
- `GET /api/reports/{id}/download` — Download executive PDF evaluation report
- `GET /api/progress` — Fetch candidate dashboard analytics and streaks

### Voice & Health
- `POST /api/voice/transcribe` — Upload speech audio recording for transcription
- `GET  /api/health` — Backend and database status health check

---

## 8. Automated Testing

Run the automated test suite with pytest:
```powershell
cd backend
.\venv\Scripts\python.exe -m pytest tests/test_backend.py -v
```
All 10 tests verify authentication, interview lifecycle, independent rubric evaluation, PDF report generation, resume parsing (PDF & DOCX), progress statistics, and user data isolation.
