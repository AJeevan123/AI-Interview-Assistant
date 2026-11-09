from fastapi import APIRouter, Depends, status
from app.schemas.auth import UserRegister, UserLogin, UserResponse, TokenResponse
from app.services.auth_service import AuthService
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister):
    """Registers a new candidate with email uniqueness check and secure password hashing."""
    return AuthService.register_user(
        name=user_in.name,
        email=user_in.email,
        password=user_in.password
    )

@router.post("/login", response_model=TokenResponse)
def login(user_in: UserLogin):
    """Authenticates credentials against MongoDB and returns a signed JWT access token."""
    return AuthService.authenticate_user(
        email=user_in.email,
        password=user_in.password
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    """Returns the verified profile of the currently authenticated user."""
    return current_user

@router.post("/logout")
def logout(current_user: dict = Depends(get_current_user)):
    """Logs out the active user session."""
    return {"message": "Logged out successfully", "user_id": current_user["id"]}
