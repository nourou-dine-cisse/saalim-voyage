"""Acces aux donnees SQLite : paiements, avis, messages de contact."""
import uuid
from datetime import datetime, timezone

from .db import connect
from .schemas import (
    ContactMessage,
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
