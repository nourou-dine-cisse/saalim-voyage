"""
Notifications e-mail vers l'agence (inscription, paiement, message de contact).

SMTP standard : fonctionne avec Gmail, un fournisseur pro, ou un service type
Resend/SendGrid en mode SMTP. Un echec d'envoi ne doit JAMAIS faire echouer la
soumission du visiteur : on journalise et on continue.
"""
import json
import smtplib
import socket
import urllib.error
import urllib.request
from contextlib import contextmanager
from email.message import EmailMessage

from .config import get_settings
from .schemas import RegistrationCreate


@contextmanager
def _force_ipv4():
    """
    Force la resolution DNS en IPv4 le temps de la connexion SMTP.

    Gmail publie des adresses IPv6, que Python essaie en premier. Or beaucoup
    de conteneurs (dont Railway, ou la sortie IPv6 est desactivee) n'ont aucune
    route IPv6 : la connexion echoue alors avec "[Errno 101] Network is
    unreachable" avant meme d'avoir tente l'IPv4.
    """
    original = socket.getaddrinfo

    def ipv4_only(host, port, family=0, type=0, proto=0, flags=0):
        return original(host, port, socket.AF_INET, type, proto, flags)

    socket.getaddrinfo = ipv4_only
    try:
        yield
    finally:
        socket.getaddrinfo = original


def _send_via_resend(subject: str, body: str) -> None:
    """
    Envoi via l'API HTTPS de Resend (port 443). Utilise des que RESEND_API_KEY
    est definie : indispensable sur Railway, qui bloque le SMTP sortant sur
    tous les ports. Le forcage IPv4 s'applique ici aussi, faute de route IPv6.
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
        with _force_ipv4(), urllib.request.urlopen(req, timeout=20) as resp:
            resp.read()
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode(errors="replace")[:400]
        raise RuntimeError(f"Resend a refuse l'envoi (code {exc.code}) : {detail}") from exc


def _send(subject: str, body: str) -> None:
    """Envoi brut. Leve une exception en cas d'echec (gere par les appelants)."""
    settings = get_settings()

    # Voie HTTPS prioritaire si configuree (seule option viable sur Railway).
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
    with _force_ipv4():
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
