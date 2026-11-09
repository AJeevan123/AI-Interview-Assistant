import logging
from datetime import datetime, timezone
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.database import Database
from app.config import settings

logger = logging.getLogger("uvicorn.error")

_client: MongoClient | None = None
_db: Database | None = None

def get_mongo_client() -> MongoClient:
    global _client
    if _client is None:
        try:
            _client = MongoClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000
            )
            # Verify connectivity
            _client.admin.command('ping')
            logger.info("Connected successfully to MongoDB at %s", settings.MONGODB_URI)
        except Exception as exc:
            logger.error("Failed to connect to MongoDB: %s", exc)
            raise exc
    return _client

def get_database() -> Database:
    global _db
    if _db is None:
        client = get_mongo_client()
        _db = client[settings.DATABASE_NAME]
    return _db

def close_mongo_connection():
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None
        logger.info("MongoDB connection closed.")

def init_db():
    """Initializes collections, indexes, and seeds the default demo candidate."""
    try:
        db = get_database()
        
        # 1. Indexes for 'users'
        db.users.create_index([("email", ASCENDING)], unique=True)
        db.users.create_index([("id", ASCENDING)], unique=True)
        
        # 2. Indexes for 'interviews'
        db.interviews.create_index([("id", ASCENDING)], unique=True)
        db.interviews.create_index([("user_id", ASCENDING)])
        db.interviews.create_index([("created_at", DESCENDING)])
        
        # 3. Indexes for 'interview_reports'
        db.interview_reports.create_index([("interview_id", ASCENDING)], unique=True)
        db.interview_reports.create_index([("user_id", ASCENDING)])
        db.interview_reports.create_index([("created_at", DESCENDING)])
        
        # 4. Indexes for 'resume_analyses'
        db.resume_analyses.create_index([("id", ASCENDING)], unique=True)
        db.resume_analyses.create_index([("user_id", ASCENDING)])
        db.resume_analyses.create_index([("created_at", DESCENDING)])
        
        # Seed default demo account for instant out-of-the-box frontend login
        demo_user = db.users.find_one({"email": "demo@interview.ai"})
        if not demo_user:
            from app.utils.security import hash_password
            demo_id = "usr_demo123456"
            now_iso = datetime.now(timezone.utc).isoformat()
            db.users.insert_one({
                "id": demo_id,
                "name": "Demo Candidate",
                "email": "demo@interview.ai",
                "password_hash": hash_password("password123"),
                "created_at": now_iso,
                "updated_at": now_iso
            })
            logger.info("Created default demo user: demo@interview.ai")

        # Seed default administrator account
        admin_user = db.users.find_one({"email": "admin@interview.ai"})
        if not admin_user:
            from app.utils.security import hash_password
            admin_id = "usr_admin123456"
            now_iso = datetime.now(timezone.utc).isoformat()
            db.users.insert_one({
                "id": admin_id,
                "name": "Administrator",
                "email": "admin@interview.ai",
                "password_hash": hash_password("admin123"),
                "created_at": now_iso,
                "updated_at": now_iso
            })
            logger.info("Created default admin user: admin@interview.ai")
            
        logger.info("MongoDB collections and indexes initialized successfully.")
    except Exception as exc:
        logger.warning("MongoDB initialization warning: %s", exc)
