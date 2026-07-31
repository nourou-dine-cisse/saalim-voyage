"""
Un dossier Google Drive par pèlerin : fiche récapitulative + scan du passeport.
Le dossier est la source de vérité documentaire (choix validé avec l'agence) ;
la Google Sheet d'index (sheets_service.py) n'est qu'un raccourci de consultation
pour que l'admin n'ait pas à ouvrir Drive à chaque fois.
"""
import io
import json
from datetime import datetime, timezone

from fastapi import UploadFile
from googleapiclient.http import MediaIoBaseUpload

from .config import get_settings
from .google_clients import get_drive_client
from .schemas import RegistrationCreate


def _folder_name(reg: RegistrationCreate) -> str:
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H%M")
    return f"{reg.full_name} — {ts}"


def create_pilgrim_folder(reg: RegistrationCreate) -> tuple[str, str]:
    """Crée le dossier du pèlerin sous le dossier racine. Retourne (folder_id, webViewLink)."""
    settings = get_settings()
    drive = get_drive_client()
    metadata = {
        "name": _folder_name(reg),
        "mimeType": "application/vnd.google-apps.folder",
        "parents": [settings.drive_root_folder_id],
    }
    folder = drive.files().create(body=metadata, fields="id, webViewLink").execute()
    return folder["id"], folder["webViewLink"]


def upload_fiche(folder_id: str, reg: RegistrationCreate) -> None:
    """Dépose une fiche récapitulative JSON lisible dans le dossier du pèlerin."""
    drive = get_drive_client()
    payload = json.dumps(reg.model_dump(mode="json"), ensure_ascii=False, indent=2)
    media = MediaIoBaseUpload(io.BytesIO(payload.encode("utf-8")), mimetype="application/json")
    metadata = {"name": "fiche.json", "parents": [folder_id]}
    drive.files().create(body=metadata, media_body=media, fields="id").execute()


def upload_passport(folder_id: str, file: UploadFile, content: bytes) -> str | None:
    """Dépose le scan du passeport dans le dossier du pèlerin. Retourne l'id du fichier Drive."""
    if not content:
        return None
    drive = get_drive_client()
    media = MediaIoBaseUpload(io.BytesIO(content), mimetype=file.content_type or "application/octet-stream")
    metadata = {"name": f"passeport_{file.filename}", "parents": [folder_id]}
    created = drive.files().create(body=metadata, media_body=media, fields="id").execute()
    return created["id"]


# --- Videos ---------------------------------------------------------------

IMAGES_FOLDER_NAME = "Images site"


def _get_or_create_images_folder() -> str:
    """Sous-dossier dedie aux images du site, cree au premier upload."""
    settings = get_settings()
    drive = get_drive_client()
    root = settings.drive_root_folder_id
    query = (
        f"name = '{IMAGES_FOLDER_NAME}' and '{root}' in parents "
        "and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    )
    found = drive.files().list(q=query, fields="files(id)", pageSize=1).execute().get("files", [])
    if found:
        return found[0]["id"]

    created = drive.files().create(
        body={
            "name": IMAGES_FOLDER_NAME,
            "mimeType": "application/vnd.google-apps.folder",
            "parents": [root],
        },
        fields="id",
    ).execute()
    return created["id"]


def upload_image(file: UploadFile, content: bytes) -> tuple[str, str]:
    """
    Depose une image dans le sous-dossier Images et la rend lisible par toute
    personne disposant du lien (necessaire pour l'affichage public).
    Retourne (file_id, url_affichable).
    """
    drive = get_drive_client()
    folder_id = _get_or_create_images_folder()

    media = MediaIoBaseUpload(
        io.BytesIO(content),
        mimetype=file.content_type or "image/jpeg",
        resumable=False,
    )
    created = drive.files().create(
        body={"name": file.filename or "image.jpg", "parents": [folder_id]},
        media_body=media,
        fields="id",
    ).execute()
    file_id = created["id"]

    drive.permissions().create(fileId=file_id, body={"role": "reader", "type": "anyone"}).execute()

    # Le lien "thumbnail" de Drive se comporte comme une vraie image (contrairement
    # a l'URL de partage, qui renvoie une page HTML) et accepte un redimensionnement.
    return file_id, f"https://drive.google.com/thumbnail?id={file_id}&sz=w1200"


def delete_file(file_id: str) -> None:
    """Supprime definitivement un fichier Drive (utilise pour les videos)."""
    get_drive_client().files().delete(fileId=file_id).execute()
