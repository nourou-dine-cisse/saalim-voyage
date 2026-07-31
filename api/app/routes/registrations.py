from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import ValidationError

from ..auth import require_admin
from ..drive_service import create_pilgrim_folder, upload_fiche, upload_passport
from ..email_service import notify_admin_new_registration
from .. import store
from ..schemas import RegistrationCreate, RegistrationIndexRow, RegistrationResult, ServiceType
from ..sheets_service import append_registration_row, list_registrations

router = APIRouter(prefix="/registrations", tags=["registrations"])

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 Mo, identique à la limite déjà en place côté frontend
ALLOWED_CONTENT_TYPES = {"application/pdf", "image/jpeg", "image/png"}


@router.post("", response_model=RegistrationResult)
async def submit_registration(
    full_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    whatsapp: Optional[str] = Form(None),
    country: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    service_type: ServiceType = Form(ServiceType.omra_full),
    departure_date: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    passport_valid_6_months: bool = Form(False),
    language: str = Form("fr"),
    passport: Optional[UploadFile] = File(None),
):
    # Le champ date arrive en texte brut depuis le formulaire (multipart) ; on filtre
    # ici les valeurs manifestement invalides (ex. le "string" pré-rempli par défaut
    # dans l'UI Swagger) pour renvoyer une erreur 422 claire plutôt qu'un 500.
    clean_departure_date = departure_date or None
    if clean_departure_date and clean_departure_date.strip().lower() == "string":
        clean_departure_date = None

    try:
        reg = RegistrationCreate(
            full_name=full_name,
            email=email,
            phone=phone,
            whatsapp=whatsapp or None,
            country=country or None,
            city=city or None,
            service_type=service_type,
            departure_date=clean_departure_date,
            notes=notes or None,
            passport_valid_6_months=passport_valid_6_months,
            language=language,
        )
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors()) from exc

    passport_bytes = b""
    if passport is not None:
        if passport.content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(status_code=400, detail="Format de passeport non supporté (PDF, JPG, PNG).")
        passport_bytes = await passport.read()
        if len(passport_bytes) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="Fichier trop lourd (max 5 Mo).")

    # 1. Dossier Drive dédié au pèlerin
    folder_id, folder_link = create_pilgrim_folder(reg)

    # 2. Fiche récapitulative + passeport dans ce dossier
    upload_fiche(folder_id, reg)
    if passport is not None and passport_bytes:
        upload_passport(folder_id, passport, passport_bytes)

    # 3a. Copie texte en base : l'admin reste consultable meme si Google est en panne
    store.create_registration(reg, folder_link)

    # 3b. Index Google Sheet (conserve : pratique pour consulter/filtrer dans Drive)
    try:
        append_registration_row(folder_id, reg, folder_link)
    except Exception as exc:  # noqa: BLE001 - l'inscription est deja sauvegardee en base
        print(f"[sheets] index non mis a jour : {exc}")

    # 4. Notification admin (journalisee, ne fait jamais echouer l'inscription)
    notify_admin_new_registration(reg, folder_link)

    return RegistrationResult(
        registration_id=folder_id,
        drive_folder_id=folder_id,
        drive_folder_link=folder_link,
    )


@router.get("", response_model=list[RegistrationIndexRow], dependencies=[Depends(require_admin)])
def get_registrations():
    """
    Reserve a l'admin : lecture depuis la Google Sheet, qui reste la reference
    consultable directement dans Drive. SQLite en garde une copie de secours
    (voir store.create_registration) au cas ou la feuille serait perdue.
    """
    return list_registrations()
