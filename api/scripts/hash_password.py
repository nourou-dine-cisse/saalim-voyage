"""
Génère l'empreinte à placer dans ADMIN_PASSWORD_HASH (api/.env), ainsi qu'une
clé JWT_SECRET aléatoire si besoin.

    cd api
    source .venv/bin/activate
    python scripts/hash_password.py
"""
import secrets
import sys
from getpass import getpass
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.security import hash_password  # noqa: E402


def main():
    password = getpass("Mot de passe admin : ")
    confirm = getpass("Confirmer            : ")
    if password != confirm:
        raise SystemExit("Les mots de passe ne correspondent pas.")
    if len(password) < 8:
        raise SystemExit("Choisissez un mot de passe d'au moins 8 caractères.")

    print("\n=== À copier dans api/.env ===\n")
    print(f"ADMIN_PASSWORD_HASH={hash_password(password)}")
    print(f"JWT_SECRET={secrets.token_urlsafe(48)}")
    print("\n(Ne réutilisez pas le même JWT_SECRET en production qu'en local.)")


if __name__ == "__main__":
    main()
