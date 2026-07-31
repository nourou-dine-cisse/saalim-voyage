"""
Notifications e-mail vers l'agence (inscription, paiement, message de contact).

SMTP standard : fonctionne avec Gmail, un fournisseur pro, ou un service type
Resend/SendGrid en mode SMTP. Un echec d'envoi ne doit JAMAIS faire echouer la
soumission du visiteur : on journalise et on continue.
"""
import json
import smtplib
import urllib.error
import urllib.request
from email.message import EmailMessage

from .config import get_settings
from .schemas import RegistrationCreate


def _send_via_resend(subject: str, body: str) -> None:
    """
    Envoi via l'API HTTPS de Resend. Utilise quand RESEND_API_KEY est definie :
    une simple requete web, donc insensible aux blocages du port SMTP que
    pratiquent certains hebergeurs contre le spam.
    """
    settings = get_settings()
    payload = json.dumps({
        "from": settings.resend_from,
        "to": [settings.admin_notification_email],
        "subject": subject,
        "text": body,
    }).encode()

    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=payload,
        headers={
            "Authorization": f"Bearer {settings.resend_api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            resp.read()
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode(errors="replace")[:300]
        raise RuntimeError(f"Resend a refuse l'envoi ({exc.code}) : {detail}") from exc


def _send(subject: str, body: str) -> None:
    """Envoi brut. Leve une exception en cas d'echec (gere par les appelants)."""
    settings = get_settings()

    if settings.resend_api_key:
        _send_via_resend(subject, body)
        return

    msg = EmailMessage()
    msg["Subject"] = subject
    # Gmail refuse une adresse d'expedition differente du compte authentifie
    # (sauf alias verifie) : on retombe donc sur SMTP_USERNAME en cas d'ecart.
    expediteur = settings.smtp_from or settings.smtp_username
    if "gmail.com" in settings.smtp_host and expediteur != settings.smtp_username:
        expediteur = settings.smtp_username
    msg["From"] = expediteur
    msg["To"] = settings.admin_notification_email
    msg.set_content(body)

    # Deux protocoles selon le port :
    #  - 465 : SSL des la connexion (SMTP_SSL)
    #  - 587 (et autres) : connexion claire puis passage en TLS (STARTTLS)
    # Le timeout explicite evite un blocage indefini si le port est filtre par
    # l'hebergeur, qui jette les paquets au lieu de refuser la connexion.
    if settings.smtp_port == 465:
        with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=15) as server:
            server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(msg)
    else:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
            server.starttls()
            server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(msg)


def notify_admin(subject: str, body: str) -> None:
    """Notification tolerante a la panne : journalise l'erreur au lieu de la propager."""
    try:
        _send(subject, body)
        print(f"[email] envoye : {subject}")
    except Exception as exc:  # noqa: BLE001
        print(f"[email] ECHEC ({subject}) : {type(exc).__name__} — {exc}")


# Conserve pour compatibilite avec les appels existants.
notify_admin_simple = notify_admin


def notify_admin_new_registration(reg: RegistrationCreate, drive_folder_link: str) -> None:
    notify_admin(
        f"Nouvelle inscription — {reg.full_name}",
        "Nouvelle inscription recue sur Saalim Voyages.\n\n"
        f"Nom : {reg.full_name}\n"
        f"Email : {reg.email}\n"
        f"Telephone : {reg.phone}\n"
        f"WhatsApp : {reg.whatsapp or '—'}\n"
        f"Pays / ville : {reg.country or '—'} / {reg.city or '—'}\n"
        f"Service : {reg.service_type.value}\n"
        f"Date de depart souhaitee : {reg.departure_date or 'non precisee'}\n"
        f"Passeport valide 6 mois : {'oui' if reg.passport_valid_6_months else 'non'}\n"
        f"Notes : {reg.notes or '—'}\n\n"
        f"Dossier complet (fiche + passeport) : {drive_folder_link}\n",
    )
