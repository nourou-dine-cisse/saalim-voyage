"""
Authentification de l'unique compte admin, gérée par l'API elle-même.

Pas de base de données : l'e-mail et l'empreinte du mot de passe vivent dans les
variables d'environnement. Le mot de passe n'est jamais stocké en clair — on
conserve une empreinte PBKDF2-HMAC-SHA256 salée (bibliothèque standard Python,
aucune dépendance supplémentaire).

Générer une empreinte : python scripts/hash_password.py
"""
import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone

import jwt

PBKDF2_ITERATIONS = 390_000
HASH_PREFIX = "pbkdf2_sha256"


def hash_password(password: str, salt: bytes | None = None) -> str:
    """Retourne une empreinte au format pbkdf2_sha256$<iterations>$<salt_hex>$<hash_hex>."""
    salt = salt or os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PBKDF2_ITERATIONS)
    return f"{HASH_PREFIX}${PBKDF2_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        prefix, iterations, salt_hex, digest_hex = stored.split("$")
        if prefix != HASH_PREFIX:
            return False
        digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), int(iterations))
    except (ValueError, AttributeError):
        return False
    # comparaison à temps constant : évite de révéler le mot de passe par timing
    return hmac.compare_digest(digest.hex(), digest_hex)


def create_access_token(subject: str, secret: str, expires_minutes: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "role": "admin",
        "iat": now,
        "exp": now + timedelta(minutes=expires_minutes),
        "jti": secrets.token_hex(8),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def decode_access_token(token: str, secret: str) -> dict:
    """Lève jwt.PyJWTError si le jeton est invalide ou expiré."""
    return jwt.decode(token, secret, algorithms=["HS256"])
