"""
Verifie la configuration SMTP en envoyant un e-mail de test a l'adresse admin.

    cd api
    source .venv/bin/activate
    python scripts/test_email.py

Sur Railway : onglet Console du service, puis `python scripts/test_email.py`.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import get_settings  # noqa: E402
from app.email_service import _send  # noqa: E402


def main():
    s = get_settings()
    print("Configuration utilisee :")
    print(f"  serveur     : {s.smtp_host}:{s.smtp_port}")
    print(f"  compte      : {s.smtp_username}")
    print(f"  expediteur  : {s.smtp_from}")
    print(f"  destinataire: {s.admin_notification_email}")
    if "gmail.com" in s.smtp_host and s.smtp_from != s.smtp_username:
        print("  NOTE : Gmail imposera l'adresse du compte comme expediteur.")
    print()

    try:
        _send("Test Saalim Voyages", "Ceci est un e-mail de test. Si vous le recevez, la configuration est bonne.")
    except Exception as exc:  # noqa: BLE001
        print(f"ECHEC : {type(exc).__name__} — {exc}\n")
        message = str(exc).lower()
        if "authentication" in message or "username and password" in message:
            print("Cause probable : SMTP_PASSWORD invalide.")
            print("Gmail exige un MOT DE PASSE D'APPLICATION (16 caracteres),")
            print("pas le mot de passe habituel du compte : myaccount.google.com/apppasswords")
        elif "timed out" in message or "connection" in message:
            print("Cause probable : le port SMTP est bloque par l'hebergeur ou le reseau.")
            print("Solution : utiliser le port 465 (SSL) ou un service HTTP type Resend/SendGrid.")
        elif "sender" in message or "from" in message:
            print("Cause probable : l'adresse d'expedition est refusee.")
            print("Mettez SMTP_FROM a la meme valeur que SMTP_USERNAME.")
        raise SystemExit(1)

    print(f"OK — e-mail envoye a {s.admin_notification_email}. Verifiez la boite de reception ET les spams.")


if __name__ == "__main__":
    main()
