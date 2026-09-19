from datetime import timedelta
from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.auth import UserRegister, UserLogin, UserResponse, Token
from app.security.auth_handler import verify_password, get_password_hash, create_access_token
from app.security.rbac import get_current_user
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication & RBAC"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserRegister, db: Session = Depends(get_db)):
    """Register a new user (Citizen or Officer)."""
    existing_user = db.query(User).filter(
        (User.username == user_in.username) | (User.email == user_in.email)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered."
        )

    new_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role or UserRole.CITIZEN,
        department=user_in.department,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Standard OAuth2 Password Grant login endpoint."""
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role.value},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return Token(access_token=access_token, token_type="bearer", role=user.role, username=user.username)

@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    """Get the currently logged-in user profile and permissions."""
    return current_user

@router.get("/demo-tokens", summary="Get pre-generated JWT tokens for Citizen, Officer, and Admin testing")
def get_demo_tokens() -> Dict[str, str]:
    """Generates instant test JWT tokens for all three roles so testers can test RBAC without logging in."""
    citizen_token = create_access_token(data={"sub": "demo_citizen", "role": "CITIZEN"})
    officer_token = create_access_token(data={"sub": "demo_officer", "role": "OFFICER"})
    admin_token = create_access_token(data={"sub": "demo_admin", "role": "ADMIN"})

    return {
        "CITIZEN_TOKEN": f"Bearer {citizen_token}",
        "OFFICER_TOKEN": f"Bearer {officer_token}",
        "ADMIN_TOKEN": f"Bearer {admin_token}",
        "note": "Copy any token and authorize in Swagger UI (Authorize button at top right)"
    }
