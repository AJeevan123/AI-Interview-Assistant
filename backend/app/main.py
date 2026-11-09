from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.config import settings
from app.database import init_db, close_mongo_connection, get_mongo_client
from app.routes import auth, interviews, resume, reports, voice, progress

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize MongoDB collections and indexes on startup
    init_db()
    yield
    # Clean up MongoDB connection pool on shutdown
    close_mongo_connection()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-ready FastAPI backend for AI Interview Coach powered by MongoDB and Google Gemini API",
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Robust CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router)
app.include_router(interviews.router)
app.include_router(resume.router)
app.include_router(reports.router)
app.include_router(voice.router)
app.include_router(progress.router)

@app.get("/")
def root():
    """Root endpoint welcoming visitors and providing navigation links."""
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "documentation": "/docs",
        "redoc": "/redoc",
        "health_check": "/api/health",
        "message": "AI Interview Coach FastAPI backend is running successfully."
    }

@app.get("/api/health")
def health_check():
    """Health status endpoint reporting backend, database, and AI service readiness."""
    mongo_status = "connected"
    try:
        client = get_mongo_client()
        client.admin.command('ping')
    except Exception as exc:
        mongo_status = f"unhealthy: {str(exc)}"

    ai_provider = "Google Gemini Live" if bool(settings.GEMINI_API_KEY) else "Intelligent Rubric NLP Fallback"

    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": {
            "type": "MongoDB",
            "name": settings.DATABASE_NAME,
            "status": mongo_status
        },
        "ai_engine": {
            "provider": ai_provider,
            "model": settings.GEMINI_MODEL,
            "live_key_configured": bool(settings.GEMINI_API_KEY)
        },
        "academic_metadata": {
            "supervisor": "Dr. A V S Pavan Kumar",
            "department": "AIML-B",
            "group": 18,
            "students": [
                {"name": "D. ABHAY", "roll": "24CSEAIML243", "reg": "24UG010737"},
                {"name": "KORADA SRAVANTH KUMAR", "roll": "24CSEAIML256", "reg": "24UG010749"},
                {"name": "KODI JANAKI RAO", "roll": "24CSEAIML261", "reg": "24UG010753"}
            ]
        }
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Safe fallback error handler guaranteeing consistent JSON responses without exposing raw traces."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"An internal server error occurred: {str(exc)}"}
    )
