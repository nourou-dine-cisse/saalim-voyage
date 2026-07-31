"""
Protection des routes réservées à l'admin.

Le frontend se connecte via POST /auth/login, reçoit un jeton signé, puis le
renvoie en en-tête Authorization sur chaque appel protégé.
"""
import jwt
from fastapi import Header, HTTPException, status

from .config import get_settings
from .security import decode_access_token


def require_admin(authorization: str = Header(default="")) -> str:
    """Dépendance FastAPI pour les routes admin. Retourne l'identifiant de l'admin."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token manquant")

    token = authorization.removeprefix("Bearer ").strip()
    settings = get_settings()
    try:
        claims = decode_access_token(token, settings.jwt_secret)
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expirée, reconnectez-vous."
        ) from exc
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide") from exc

    if claims.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès admin requis")

    return claims.get("sub", "")
