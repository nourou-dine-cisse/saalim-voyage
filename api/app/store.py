"""Acces aux donnees SQLite : paiements, avis, messages de contact."""
import json
import uuid
from datetime import datetime, timezone

from .db import connect
from .schemas import (
    ContactMessage,
    Departure,
    DepartureBase,
    Package,
    PackageBase,
    RegistrationRow,
    VideoLink,
    ContactMessageCreate,
    Payment,
    PaymentCreate,
    Review,
    ReviewCreate,
)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _new_id() -> str:
    return uuid.uuid4().hex


# --- Paiements ------------------------------------------------------------


def create_payment(data: PaymentCreate) -> Payment:
    row = Payment(id=_new_id(), created_at=_now(), **data.model_dump())
    with connect() as conn:
        conn.execute(
            """INSERT INTO payments
               (id, created_at, payer_name, payer_phone, amount, currency, method,
                installment_type, reference, notes, status)
               VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            (
                row.id, row.created_at, row.payer_name, row.payer_phone, row.amount,
                row.currency, row.method, row.installment_type, row.reference,
                row.notes, row.status,
            ),
        )
    return row


def list_payments() -> list[Payment]:
    with connect() as conn:
        rows = conn.execute("SELECT * FROM payments ORDER BY created_at DESC").fetchall()
    return [Payment(**dict(r)) for r in rows]


def confirm_payment(payment_id: str) -> bool:
    with connect() as conn:
        cur = conn.execute("UPDATE payments SET status='confirmed' WHERE id=?", (payment_id,))
        return cur.rowcount > 0


def count_payments(status: str | None = None) -> int:
    with connect() as conn:
        if status:
            return conn.execute("SELECT COUNT(*) c FROM payments WHERE status=?", (status,)).fetchone()["c"]
        return conn.execute("SELECT COUNT(*) c FROM payments").fetchone()["c"]


# --- Avis -----------------------------------------------------------------


def create_review(data: ReviewCreate) -> Review:
    row = Review(id=_new_id(), created_at=_now(), approved=False, **data.model_dump())
    with connect() as conn:
        conn.execute(
            """INSERT INTO reviews
               (id, created_at, author_name, email, rating, comment, service_type, travel_period, approved)
               VALUES (?,?,?,?,?,?,?,?,?)""",
            (
                row.id, row.created_at, row.author_name,
                str(row.email) if row.email else None,
                row.rating, row.comment, row.service_type, row.travel_period, 0,
            ),
        )
    return row


def _to_review(r) -> Review:
    d = dict(r)
    d["approved"] = bool(d["approved"])
    return Review(**d)


def list_reviews(approved_only: bool, limit: int | None = None) -> list[Review]:
    sql = "SELECT * FROM reviews"
    params: tuple = ()
    if approved_only:
        sql += " WHERE approved=1"
    sql += " ORDER BY created_at DESC"
    if limit:
        sql += " LIMIT ?"
        params = (limit,)
    with connect() as conn:
        return [_to_review(r) for r in conn.execute(sql, params).fetchall()]


def approve_review(review_id: str) -> bool:
    with connect() as conn:
        return conn.execute("UPDATE reviews SET approved=1 WHERE id=?", (review_id,)).rowcount > 0


def delete_review(review_id: str) -> bool:
    with connect() as conn:
        return conn.execute("DELETE FROM reviews WHERE id=?", (review_id,)).rowcount > 0


def count_pending_reviews() -> int:
    with connect() as conn:
        return conn.execute("SELECT COUNT(*) c FROM reviews WHERE approved=0").fetchone()["c"]


# --- Messages de contact --------------------------------------------------


def create_contact_message(data: ContactMessageCreate) -> ContactMessage:
    row = ContactMessage(id=_new_id(), created_at=_now(), **data.model_dump())
    with connect() as conn:
        conn.execute(
            """INSERT INTO contact_messages
               (id, created_at, full_name, email, phone, subject, message, language)
               VALUES (?,?,?,?,?,?,?,?)""",
            (
                row.id, row.created_at, row.full_name, str(row.email),
                row.phone, row.subject, row.message, row.language,
            ),
        )
    return row


def list_contact_messages() -> list[ContactMessage]:
    with connect() as conn:
        rows = conn.execute("SELECT * FROM contact_messages ORDER BY created_at DESC").fetchall()
    return [ContactMessage(**dict(r)) for r in rows]


# --- Inscriptions (copie texte ; les fichiers restent sur Drive) -----------


def create_registration(reg, drive_folder_link: str | None) -> str:
    """Enregistre les donnees textuelles du formulaire. Retourne l'id."""
    row_id = _new_id()
    with connect() as conn:
        conn.execute(
            """INSERT INTO registrations
               (id, created_at, full_name, email, phone, whatsapp, country, city,
                service_type, departure_date, notes, passport_valid_6_months,
                language, drive_folder_link, status)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                row_id, _now(), reg.full_name, str(reg.email), reg.phone,
                reg.whatsapp, reg.country, reg.city, reg.service_type.value,
                reg.departure_date.isoformat() if reg.departure_date else None,
                reg.notes, 1 if reg.passport_valid_6_months else 0,
                reg.language, drive_folder_link, "new",
            ),
        )
    return row_id


def list_registrations_db() -> list[RegistrationRow]:
    with connect() as conn:
        rows = conn.execute("SELECT * FROM registrations ORDER BY created_at DESC").fetchall()
    out = []
    for r in rows:
        d = dict(r)
        d["passport_valid_6_months"] = bool(d["passport_valid_6_months"])
        out.append(RegistrationRow(**d))
    return out


def count_registrations() -> int:
    with connect() as conn:
        return conn.execute("SELECT COUNT(*) c FROM registrations").fetchone()["c"]


# --- Forfaits -------------------------------------------------------------


def _to_package(r) -> Package:
    d = dict(r)
    d["active"] = bool(d["active"])
    d["features"] = json.loads(d["features"] or "[]")
    return Package(**d)


def create_package(data: PackageBase, image_url: str | None, image_file_id: str | None) -> Package:
    row_id = _new_id()
    created = _now()
    with connect() as conn:
        conn.execute(
            """INSERT INTO packages
               (id, created_at, sort_order, name, duration, price, description,
                features, image_url, image_file_id, active)
               VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            (
                row_id, created, data.sort_order, data.name, data.duration, data.price,
                data.description, json.dumps(data.features, ensure_ascii=False),
                image_url, image_file_id, 1 if data.active else 0,
            ),
        )
    return Package(id=row_id, created_at=created, image_url=image_url,
                   image_file_id=image_file_id, **data.model_dump())


def list_packages(active_only: bool) -> list[Package]:
    sql = "SELECT * FROM packages"
    if active_only:
        sql += " WHERE active = 1"
    sql += " ORDER BY sort_order ASC, created_at ASC"
    with connect() as conn:
        return [_to_package(r) for r in conn.execute(sql).fetchall()]


def get_package(package_id: str) -> Package | None:
    with connect() as conn:
        r = conn.execute("SELECT * FROM packages WHERE id=?", (package_id,)).fetchone()
    return _to_package(r) if r else None


def update_package(package_id: str, data: PackageBase,
                   image_url: str | None, image_file_id: str | None) -> bool:
    """Met a jour le forfait. L'image n'est remplacee que si une nouvelle est fournie."""
    sets = [
        "sort_order=?", "name=?", "duration=?", "price=?",
        "description=?", "features=?", "active=?",
    ]
    params: list = [
        data.sort_order, data.name, data.duration, data.price,
        data.description, json.dumps(data.features, ensure_ascii=False),
        1 if data.active else 0,
    ]
    if image_url:
        sets += ["image_url=?", "image_file_id=?"]
        params += [image_url, image_file_id]
    params.append(package_id)
    with connect() as conn:
        cur = conn.execute(f"UPDATE packages SET {', '.join(sets)} WHERE id=?", params)
        return cur.rowcount > 0


def delete_package(package_id: str) -> bool:
    with connect() as conn:
        return conn.execute("DELETE FROM packages WHERE id=?", (package_id,)).rowcount > 0


# --- Videos (liens YouTube) -----------------------------------------------


def create_video(title: str, youtube_id: str, youtube_url: str, sort_order: int) -> VideoLink:
    row_id = _new_id()
    created = _now()
    with connect() as conn:
        conn.execute(
            "INSERT INTO videos (id, created_at, sort_order, title, youtube_id, youtube_url) VALUES (?,?,?,?,?,?)",
            (row_id, created, sort_order, title, youtube_id, youtube_url),
        )
    return VideoLink(id=row_id, created_at=created, sort_order=sort_order,
                     title=title, youtube_id=youtube_id, youtube_url=youtube_url)


def list_video_links() -> list[VideoLink]:
    with connect() as conn:
        rows = conn.execute("SELECT * FROM videos ORDER BY sort_order ASC, created_at ASC").fetchall()
    return [VideoLink(**dict(r)) for r in rows]


def delete_video_link(video_id: str) -> bool:
    with connect() as conn:
        return conn.execute("DELETE FROM videos WHERE id=?", (video_id,)).rowcount > 0


# --- Dates de depart ------------------------------------------------------


def _to_departure(r) -> Departure:
    d = dict(r)
    d["active"] = bool(d["active"])
    return Departure(**d)


def create_departure(data: DepartureBase, image_url: str | None, image_file_id: str | None) -> Departure:
    row_id = _new_id()
    created = _now()
    with connect() as conn:
        conn.execute(
            """INSERT INTO departures
               (id, created_at, date, package_label, seats, description, image_url, image_file_id, active)
               VALUES (?,?,?,?,?,?,?,?,?)""",
            (row_id, created, data.date, data.package_label, data.seats,
             data.description, image_url, image_file_id, 1 if data.active else 0),
        )
    return Departure(id=row_id, created_at=created, image_url=image_url,
                     image_file_id=image_file_id, **data.model_dump())


def list_departures_db(active_only: bool) -> list[Departure]:
    sql = "SELECT * FROM departures"
    if active_only:
        sql += " WHERE active = 1"
    sql += " ORDER BY date ASC"
    with connect() as conn:
        return [_to_departure(r) for r in conn.execute(sql).fetchall()]


def get_departure(departure_id: str) -> Departure | None:
    with connect() as conn:
        r = conn.execute("SELECT * FROM departures WHERE id=?", (departure_id,)).fetchone()
    return _to_departure(r) if r else None


def update_departure(departure_id: str, data: DepartureBase,
                     image_url: str | None, image_file_id: str | None) -> bool:
    sets = ["date=?", "package_label=?", "seats=?", "description=?", "active=?"]
    params: list = [data.date, data.package_label, data.seats, data.description, 1 if data.active else 0]
    if image_url:
        sets += ["image_url=?", "image_file_id=?"]
        params += [image_url, image_file_id]
    params.append(departure_id)
    with connect() as conn:
        return conn.execute(f"UPDATE departures SET {', '.join(sets)} WHERE id=?", params).rowcount > 0


def delete_departure_db(departure_id: str) -> bool:
    with connect() as conn:
        return conn.execute("DELETE FROM departures WHERE id=?", (departure_id,)).rowcount > 0
