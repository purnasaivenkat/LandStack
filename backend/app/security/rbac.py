from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.security.auth_handler import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token has expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    token_payload = decode_access_token(token)
    if token_payload is None or token_payload.sub is None:
        raise credentials_exception

    user = db.query(User).filter(User.username == token_payload.sub).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account"
        )
    return user

def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not token:
        return None
    token_payload = decode_access_token(token)
    if not token_payload or not token_payload.sub:
        return None
    return db.query(User).filter(User.username == token_payload.sub).first()

def require_roles(allowed_roles: List[UserRole]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Insufficient privileges. Allowed roles: {[r.value for r in allowed_roles]}"
            )
        return current_user
    return role_checker

# Predefined role dependency guards
require_citizen_or_above = require_roles([UserRole.CITIZEN, UserRole.OFFICER, UserRole.ADMIN])
require_officer_or_above = require_roles([UserRole.OFFICER, UserRole.ADMIN])
require_admin_only = require_roles([UserRole.ADMIN])
