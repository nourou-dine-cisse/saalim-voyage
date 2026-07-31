"""
Contenu editable depuis la page admin du site : dates de depart et videos.
Lecture publique (le site affiche ces contenus), ecriture reservee a l'admin.
"""
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from ..auth import require_admin
from ..drive_service import delete_file, upload_video
from ..schemas import Departure, DepartureCreate, Video
from ..sheets_service import (
    add_departure,
    add_video,
    delete_departure,
    delete_video_row,
    get_video,
    list_departures,
    list_videos,
)

router = APIRouter(tags=["contenu"])

MAX_VIDEO_SIZE = 200 * 1024 * 1024  # 200 Mo
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/webm", "video/x-m4v"}


# --- Dates de depart ------------------------------------------------------


@router.get("/departures", response_model=list[Departure])
def get_departures():
    """Public : alimente la section Planning du site."""
    return list_departures()


@router.post("/departures", response_model=Departure, dependencies=[Depends(require_admin)])
def create_departure(payload: DepartureCreate):
    return add_departure(payload.date.isoformat(), payload.package_label, payload.seats)


@router.delete("/departures/{departure_id}", dependencies=[Depends(require_admin)])
def remove_departure(departure_id: str):
    if not delete_departure(departure_id):
        raise HTTPException(status_code=404, detail="Date introuvable")
    return {"deleted": departure_id}


# --- Videos ---------------------------------------------------------------


@router.get("/videos", response_model=list[Video])
def get_videos():
    """Public : alimente la section Videos du site."""
    return list_videos()


@router.post("/videos", response_model=Video, dependencies=[Depends(require_admin)])
async def create_video(title: str = Form(...), file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(status_code=400, detail="Format non supporte (MP4, MOV, WEBM).")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Fichier vide.")
    if len(content) > MAX_VIDEO_SIZE:
        raise HTTPException(status_code=400, detail="Video trop lourde (max 200 Mo).")

    file_id, embed_url = upload_video(file, content)
    return add_video(title.strip(), file_id, embed_url)


@router.delete("/videos/{video_id}", dependencies=[Depends(require_admin)])
def remove_video(video_id: str):
    video = get_video(video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video introuvable")

    try:
        delete_file(video.drive_file_id)
    except Exception:  # noqa: BLE001 - fichier deja supprime cote Drive : on nettoie quand meme l'index
        pass

    delete_video_row(video_id)
    return {"deleted": video_id}
