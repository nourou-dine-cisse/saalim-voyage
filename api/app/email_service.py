"""
Notification e-mail à l'admin à chaque inscription validée.
SMTP simple par défaut (fonctionne avec Gmail, un fournisseur pro, ou un service
comme Resend/SendGrid en mode SMTP) — pas de dépendance à un fournisseur précis.
"""
import smtplib
from email.message import EmailMessage

from .config import get_settings
from .schemas import RegistrationCreate


def notify_admin_new_registration(reg: RegistrationCreate, drive_folder_link: str) -> None:
    settings = get_settings()

    msg = EmailMessage()
    msg["Subject"] = f"Nouvelle inscription — {reg.full_name}"
    msg["From"] = settings.smtp_from
    msg["To"] = settings.admin_notification_email
    msg.set_content(
        "Nouvelle inscription reçue sur Saalim Voyages.\n\n"
        f"Nom : {reg.full_name}\n"
        f"Email : {reg.email}\n"
        f"Téléphone : {reg.phone}\n"
        f"Service : {reg.service_type.value}\n"
        f"Date de départ souhaitée : {reg.departure_date or 'non précisée'}\n"
        f"Notes : {reg.notes or '—'}\n\n"
        f"Dossier complet (fiche + passeport) : {drive_folder_link}\n"
    )

    # timeout explicite : évite un blocage indéfini si le port SMTP est filtré
    # par le réseau (firewall/FAI qui droppe les paquets au lieu de les rejeter).
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
        server.starttls()
        server.login(settings.smtp_username, settings.smtp_password)
        server.send_message(msg)


def notify_admin_simple(subject: str, body: str) -> None:
    """
    Notification generique a l'agence (paiement declare, message de contact...).
    Un echec d'envoi ne doit jamais faire echouer la soumission du visiteur.
    """
    settings = get_settings()
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from
    msg["To"] = settings.admin_notification_email
    msg.set_content(body)
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
            server.starttls()
            server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(msg)
    except Exception as exc:  # noqa: BLE001
        print(f"[email] envoi impossible ({subject}): {exc}")
