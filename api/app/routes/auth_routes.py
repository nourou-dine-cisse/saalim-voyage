"""Connexion de l'unique compte admin."""
import hmac

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr

from ..config import get_settings
from ..security import create_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginPayload(BaseModel):
    email: EmailStr
    password: str


class LoginResult(BaseModel):
    access_token: str
    expires_in_minutes: int
    email: str


@router.post("/login", response_model=LoginResult)
def login(payload: LoginPayload):
    settings = get_settings()

    email_ok = hmac.compare_digest(payload.email.strip().lower(), settings.admin_email.strip().lower())
    password_ok = verify_password(payload.password, settings.admin_password_hash)

    # Message volontairement identique dans les deux cas : ne pas révéler
    # si c'est l'e-mail ou le mot de passe qui est erroné.
    if not (email_ok and password_ok):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiants invalides",
        )

    token = create_access_token(settings.admin_email, settings.jwt_secret, settings.jwt_expire_minutes)
    return LoginResult(
        access_token=token,
        expires_in_minutes=settings.jwt_expire_minutes,
        email=settings.admin_email,
    )
