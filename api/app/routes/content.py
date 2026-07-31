"""
Contenu editable depuis la page admin du site : dates de depart et videos.
Lecture publique (le site affiche ces contenus), ecriture reservee a l'admin.
"""
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from pydantic import BaseModel

from .. import store
from ..auth import require_admin
from ..drive_service import delete_file, upload_image
from ..schemas import (
    Departure,
    DepartureBase,
    Package,
    PackageBase,
    Place,
    PlaceBase,
    VideoLinkCreate,
)
from ..youtube import extract_youtube_id


class VideoOut(BaseModel):
    """Video telle que consommee par le site (avec l'URL d'integration prete a l'emploi)."""
    id: str
    created_at: str
    sort_order: int
    title: str
    youtube_id: str
    youtube_url: str
    embed_url: str

router = APIRouter(tags=["contenu"])

MAX_VIDEO_SIZE = 200 * 1024 * 1024  # 200 Mo
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/webm", "video/x-m4v"}


MAX_IMAGE_SIZE = 5 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _parse_package_form(
    name: str, duration: str | None, price: str | None, description: str | None,
    features: str | None, sort_order: int, active: bool,
) -> PackageBase:
    """features arrive en texte, une inclusion par ligne."""
    liste = [l.strip() for l in (features or "").splitlines() if l.strip()]
    return PackageBase(
        name=name.strip(), duration=(duration or None), price=(price or None),
        description=(description or None), features=liste,
        sort_order=sort_order, active=active,
    )


async def _read_image(image: UploadFile | None) -> bytes:
    if image is None or not image.filename:
        return b""
    if image.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Image non supportee (JPG, PNG, WEBP).")
    content = await image.read()
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="Image trop lourde (max 5 Mo).")
    return content


# --- Dates de depart ------------------------------------------------------


@router.get("/departures", response_model=list[Departure])
def get_departures():
    """Public : alimente la section Planning du site."""
    return store.list_departures_db(active_only=True)


@router.get("/departures/all", response_model=list[Departure], dependencies=[Depends(require_admin)])
def get_all_departures():
    return store.list_departures_db(active_only=False)


def _parse_departure_form(
    date: str, package_label: str, seats: int, description: str | None, active: bool,
) -> DepartureBase:
    return DepartureBase(
        date=date.strip(), package_label=package_label.strip(), seats=seats,
        description=(description or None), active=active,
    )


@router.post("/departures", response_model=Departure, dependencies=[Depends(require_admin)])
async def create_departure(
    date: str = Form(...),
    package_label: str = Form(...),
    seats: int = Form(0),
    description: str | None = Form(None),
    active: bool = Form(True),
    image: UploadFile | None = File(None),
):
    data = _parse_departure_form(date, package_label, seats, description, active)
    content = await _read_image(image)
    image_url = image_file_id = None
    if content:
        image_file_id, image_url = upload_image(image, content)
    return store.create_departure(data, image_url, image_file_id)


@router.put("/departures/{departure_id}", response_model=Departure, dependencies=[Depends(require_admin)])
async def edit_departure(
    departure_id: str,
    date: str = Form(...),
    package_label: str = Form(...),
    seats: int = Form(0),
    description: str | None = Form(None),
    active: bool = Form(True),
    image: UploadFile | None = File(None),
):
    existing = store.get_departure(departure_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Date introuvable")

    data = _parse_departure_form(date, package_label, seats, description, active)
    content = await _read_image(image)
    image_url = image_file_id = None
    if content:
        image_file_id, image_url = upload_image(image, content)
        if existing.image_file_id:
            try:
                delete_file(existing.image_file_id)
            except Exception:  # noqa: BLE001
                pass

    store.update_departure(departure_id, data, image_url, image_file_id)
    return store.get_departure(departure_id)


@router.delete("/departures/{departure_id}", dependencies=[Depends(require_admin)])
def remove_departure(departure_id: str):
    existing = store.get_departure(departure_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Date introuvable")
    if existing.image_file_id:
        try:
            delete_file(existing.image_file_id)
        except Exception:  # noqa: BLE001
            pass
    store.delete_departure_db(departure_id)
    return {"deleted": departure_id}


# --- Videos (liens YouTube) -----------------------------------------------


@router.get("/videos", response_model=list[VideoOut])
def get_videos():
    """Public : alimente la section Videos du site."""
    return [
        VideoOut(
            id=v.id, created_at=v.created_at, sort_order=v.sort_order,
            title=v.title, youtube_id=v.youtube_id, youtube_url=v.youtube_url,
            embed_url=f"https://www.youtube.com/embed/{v.youtube_id}",
        )
        for v in store.list_video_links()
    ]


@router.post("/videos", response_model=VideoOut, dependencies=[Depends(require_admin)])
def create_video(payload: VideoLinkCreate):
    youtube_id = extract_youtube_id(payload.youtube_url)
    if not youtube_id:
        raise HTTPException(
            status_code=400,
            detail="Lien YouTube non reconnu. Collez l'adresse complete de la video "
                   "(ex. https://www.youtube.com/watch?v=XXXXXXXXXXX).",
        )
    v = store.create_video(payload.title.strip(), youtube_id, payload.youtube_url.strip(), payload.sort_order)
    return VideoOut(
        id=v.id, created_at=v.created_at, sort_order=v.sort_order, title=v.title,
        youtube_id=v.youtube_id, youtube_url=v.youtube_url,
        embed_url=f"https://www.youtube.com/embed/{v.youtube_id}",
    )


@router.delete("/videos/{video_id}", dependencies=[Depends(require_admin)])
def remove_video(video_id: str):
    if not store.delete_video_link(video_id):
        raise HTTPException(status_code=404, detail="Video introuvable")
    return {"deleted": video_id}


# --- Forfaits -------------------------------------------------------------

@router.get("/packages", response_model=list[Package])
def get_packages():
    """Public : alimente la section Forfaits du site."""
    return store.list_packages(active_only=True)


@router.get("/packages/all", response_model=list[Package], dependencies=[Depends(require_admin)])
def get_all_packages():
    return store.list_packages(active_only=False)


@router.post("/packages", response_model=Package, dependencies=[Depends(require_admin)])
async def add_package(
    name: str = Form(...),
    duration: str | None = Form(None),
    price: str | None = Form(None),
    description: str | None = Form(None),
    features: str | None = Form(None),
    sort_order: int = Form(0),
    active: bool = Form(True),
    image: UploadFile | None = File(None),
):
    data = _parse_package_form(name, duration, price, description, features, sort_order, active)
    content = await _read_image(image)
    image_url = image_file_id = None
    if content:
        image_file_id, image_url = upload_image(image, content)
    return store.create_package(data, image_url, image_file_id)


@router.put("/packages/{package_id}", response_model=Package, dependencies=[Depends(require_admin)])
async def edit_package(
    package_id: str,
    name: str = Form(...),
    duration: str | None = Form(None),
    price: str | None = Form(None),
    description: str | None = Form(None),
    features: str | None = Form(None),
    sort_order: int = Form(0),
    active: bool = Form(True),
    image: UploadFile | None = File(None),
):
    existing = store.get_package(package_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Forfait introuvable")

    data = _parse_package_form(name, duration, price, description, features, sort_order, active)
    content = await _read_image(image)
    image_url = image_file_id = None
    if content:
        image_file_id, image_url = upload_image(image, content)
        if existing.image_file_id:
            try:
                delete_file(existing.image_file_id)  # evite d'accumuler des images orphelines
            except Exception:  # noqa: BLE001
                pass

    store.update_package(package_id, data, image_url, image_file_id)
    return store.get_package(package_id)


@router.delete("/packages/{package_id}", dependencies=[Depends(require_admin)])
def remove_package(package_id: str):
    existing = store.get_package(package_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Forfait introuvable")
    if existing.image_file_id:
        try:
            delete_file(existing.image_file_id)
        except Exception:  # noqa: BLE001
            pass
    store.delete_package(package_id)
    return {"deleted": package_id}


# --- Lieux saints ---------------------------------------------------------


def _parse_place_form(
    name: str, location: str | None, description: str | None, sort_order: int, active: bool,
) -> PlaceBase:
    return PlaceBase(
        name=name.strip(), location=(location or None),
        description=(description or None), sort_order=sort_order, active=active,
    )


@router.get("/places", response_model=list[Place])
def get_places():
    """Public : alimente la section Lieux saints du site."""
    return store.list_places(active_only=True)


@router.get("/places/all", response_model=list[Place], dependencies=[Depends(require_admin)])
def get_all_places():
    return store.list_places(active_only=False)


@router.post("/places", response_model=Place, dependencies=[Depends(require_admin)])
async def add_place(
    name: str = Form(...),
    location: str | None = Form(None),
    description: str | None = Form(None),
    sort_order: int = Form(0),
    active: bool = Form(True),
    image: UploadFile | None = File(None),
):
    data = _parse_place_form(name, location, description, sort_order, active)
    content = await _read_image(image)
    image_url = image_file_id = None
    if content:
        image_file_id, image_url = upload_image(image, content)
    return store.create_place(data, image_url, image_file_id)


@router.put("/places/{place_id}", response_model=Place, dependencies=[Depends(require_admin)])
async def edit_place(
    place_id: str,
    name: str = Form(...),
    location: str | None = Form(None),
    description: str | None = Form(None),
    sort_order: int = Form(0),
    active: bool = Form(True),
    image: UploadFile | None = File(None),
):
    existing = store.get_place(place_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Lieu introuvable")

    data = _parse_place_form(name, location, description, sort_order, active)
    content = await _read_image(image)
    image_url = image_file_id = None
    if content:
        image_file_id, image_url = upload_image(image, content)
        if existing.image_file_id:
            try:
                delete_file(existing.image_file_id)
            except Exception:  # noqa: BLE001
                pass

    store.update_place(place_id, data, image_url, image_file_id)
    return store.get_place(place_id)


@router.delete("/places/{place_id}", dependencies=[Depends(require_admin)])
def remove_place(place_id: str):
    existing = store.get_place(place_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Lieu introuvable")
    if existing.image_file_id:
        try:
            delete_file(existing.image_file_id)
        except Exception:  # noqa: BLE001
            pass
    store.delete_place(place_id)
    return {"deleted": place_id}
