"""
Paiements, avis et messages de contact (SQLite).
Ecriture publique (formulaires du site), consultation reservee a l'admin.
"""
from fastapi import APIRouter, Depends, HTTPException

from .. import store
from ..auth import require_admin
from ..email_service import notify_admin_simple
from ..schemas import (
    ContactMessage,
    ContactMessageCreate,
    Payment,
    PaymentCreate,
    Review,
    ReviewCreate,
)

router = APIRouter(tags=["donnees"])


# --- Paiements ------------------------------------------------------------


@router.post("/payments", response_model=Payment)
def declare_payment(payload: PaymentCreate):
    """Public : declaration de paiement Wave / Orange Money."""
    row = store.create_payment(payload)
    notify_admin_simple(
        f"Nouveau paiement declare — {row.payer_name}",
        f"Payeur : {row.payer_name}\n"
        f"Telephone : {row.payer_phone}\n"
        f"Montant : {row.amount or '—'} {row.currency}\n"
        f"Methode : {row.method}\n"
        f"Type : {row.installment_type}\n"
        f"Reference : {row.reference or '—'}\n",
    )
    return row


@router.get("/payments", response_model=list[Payment], dependencies=[Depends(require_admin)])
def get_payments():
    return store.list_payments()


@router.post("/payments/{payment_id}/confirm", dependencies=[Depends(require_admin)])
def confirm(payment_id: str):
    if not store.confirm_payment(payment_id):
        raise HTTPException(status_code=404, detail="Paiement introuvable")
    return {"confirmed": payment_id}


# --- Avis -----------------------------------------------------------------


@router.post("/reviews", response_model=Review)
def submit_review(payload: ReviewCreate):
    """Public : depot d'un avis, en attente de validation par l'admin."""
    return store.create_review(payload)


@router.get("/reviews", response_model=list[Review])
def get_public_reviews(limit: int = 3):
    """Public : avis approuves affiches sur le site."""
    return store.list_reviews(approved_only=True, limit=limit)


@router.get("/reviews/all", response_model=list[Review], dependencies=[Depends(require_admin)])
def get_all_reviews():
    return store.list_reviews(approved_only=False)


@router.post("/reviews/{review_id}/approve", dependencies=[Depends(require_admin)])
def approve(review_id: str):
    if not store.approve_review(review_id):
        raise HTTPException(status_code=404, detail="Avis introuvable")
    return {"approved": review_id}


@router.delete("/reviews/{review_id}", dependencies=[Depends(require_admin)])
def remove_review(review_id: str):
    if not store.delete_review(review_id):
        raise HTTPException(status_code=404, detail="Avis introuvable")
    return {"deleted": review_id}


# --- Messages de contact --------------------------------------------------


@router.post("/contact", response_model=ContactMessage)
def submit_contact(payload: ContactMessageCreate):
    """Public : formulaire de contact."""
    row = store.create_contact_message(payload)
    notify_admin_simple(
        f"Nouveau message — {row.full_name}",
        f"De : {row.full_name} <{row.email}>\n"
        f"Telephone : {row.phone or '—'}\n"
        f"Sujet : {row.subject or '—'}\n\n{row.message}\n",
    )
    return row


@router.get("/contact", response_model=list[ContactMessage], dependencies=[Depends(require_admin)])
def get_contact_messages():
    return store.list_contact_messages()


# --- Tableau de bord ------------------------------------------------------


@router.get("/stats", dependencies=[Depends(require_admin)])
def stats():
    return {
        "payments_total": store.count_payments(),
        "payments_confirmed": store.count_payments("confirmed"),
        "reviews_pending": store.count_pending_reviews(),
    }
