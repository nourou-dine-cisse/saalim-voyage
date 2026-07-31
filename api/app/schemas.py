"""
Schémas Pydantic — miroir du schéma Zod utilisé côté frontend
(src/components/sections/Register.tsx) pour garder les mêmes règles de validation
des deux côtés pendant la transition.
"""
from datetime import date
from datetime import date as date_type
from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class ServiceType(str, Enum):
    omra_full = "omra_full"
    hajj_full = "hajj_full"
    visa_only = "visa_only"
    flight_only = "flight_only"
    tontine = "tontine"
    custom = "custom"


class RegistrationCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(min_length=6, max_length=30)
    whatsapp: Optional[str] = Field(default=None, max_length=30)
    country: Optional[str] = Field(default=None, max_length=100)
    city: Optional[str] = Field(default=None, max_length=100)
    service_type: ServiceType = ServiceType.omra_full
    departure_date: Optional[date] = None
    notes: Optional[str] = Field(default=None, max_length=1000)
    passport_valid_6_months: bool = False
    language: str = "fr"


class RegistrationResult(BaseModel):
    registration_id: str
    drive_folder_id: str
    drive_folder_link: str


class RegistrationIndexRow(BaseModel):
    """Une ligne telle que lue depuis la Google Sheet d'index, pour l'admin."""
    registration_id: str
    created_at: str
    full_name: str
    email: str
    phone: str
    service_type: str
    departure_date: Optional[str] = None
    drive_folder_link: str


# --- Contenu editable depuis l'admin (dates de depart, videos) --------------


class Departure(BaseModel):
    id: str
    created_at: str
    date: str  # ISO YYYY-MM-DD
    package_label: str
    seats: int


class DepartureCreate(BaseModel):
    date: date_type
    package_label: str = Field(min_length=1, max_length=120)
    seats: int = Field(ge=0, le=10_000)


class Video(BaseModel):
    id: str
    created_at: str
    title: str
    drive_file_id: str
    embed_url: str


# --- Paiements, avis, messages de contact (SQLite) -------------------------


class PaymentCreate(BaseModel):
    payer_name: str = Field(min_length=2, max_length=100)
    payer_phone: str = Field(min_length=6, max_length=30)
    amount: Optional[float] = Field(default=None, gt=0, le=100_000_000)
    method: str = Field(min_length=1, max_length=30)
    installment_type: str = Field(default="full", max_length=30)
    reference: Optional[str] = Field(default=None, max_length=80)
    notes: Optional[str] = Field(default=None, max_length=500)


class Payment(PaymentCreate):
    id: str
    created_at: str
    currency: str = "XOF"
    status: str = "pending"


class ReviewCreate(BaseModel):
    author_name: str = Field(min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=10, max_length=1000)
    service_type: Optional[str] = Field(default=None, max_length=50)
    travel_period: Optional[str] = Field(default=None, max_length=80)


class Review(ReviewCreate):
    id: str
    created_at: str
    approved: bool = False


class ContactMessageCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=30)
    subject: Optional[str] = Field(default=None, max_length=200)
    message: str = Field(min_length=5, max_length=2000)
    language: str = "fr"


class ContactMessage(ContactMessageCreate):
    id: str
    created_at: str
