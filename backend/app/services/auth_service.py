import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from app.database import get_database
from app.utils.security import hash_password, verify_password, create_access_token

class AuthService:
    @staticmethod
    def register_user(name: str, email: str, password: str) -> Dict[str, Any]:
        """Registers a new user, hashes password, stores in MongoDB, and returns access token."""
        db = get_database()
        clean_email = email.strip().lower()
        
        # Prevent duplicate email registrations
        existing = db.users.find_one({"email": clean_email})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists."
            )
        
        user_id = f"usr_{uuid.uuid4().hex[:12]}"
        hashed_pw = hash_password(password)
        now_iso = datetime.now(timezone.utc).isoformat()
        
        user_doc = {
            "id": user_id,
            "name": name.strip(),
            "email": clean_email,
            "password_hash": hashed_pw,
            "created_at": now_iso,
            "updated_at": now_iso
        }
        db.users.insert_one(user_doc)
        
        token = create_access_token({"sub": user_id, "email": clean_email})
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user_id,
                "name": name.strip(),
                "email": clean_email,
                "created_at": now_iso
            }
        }

    @staticmethod
    def authenticate_user(email: str, password: str) -> Dict[str, Any]:
        """Authenticates user credentials against MongoDB and issues a signed JWT access token."""
        db = get_database()
        clean_email = email.strip().lower()
        
        user = db.users.find_one({"email": clean_email})
        if not user or not verify_password(password, user.get("password_hash", "")):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password. Please try again."
            )
        
        token = create_access_token({"sub": user["id"], "email": clean_email})
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "name": user.get("name", "Candidate"),
                "email": user["email"],
                "created_at": user.get("created_at", "")
            }
        }

    @staticmethod
    def get_user_profile(user_id: str) -> Dict[str, Any]:
        """Fetches the user's current profile from MongoDB."""
        db = get_database()
        user = db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found."
            )
        return {
            "id": user["id"],
            "name": user.get("name", "Candidate"),
            "email": user["email"],
            "created_at": user.get("created_at", "")
        }
