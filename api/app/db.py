"""
Base SQLite : inscriptions (copie texte), paiements, avis, messages de contact,
forfaits et videos.

Les pieces jointes (passeports, images de forfaits) restent sur Google Drive ;
SQLite conserve les donnees textuelles, ce qui rend l'admin rapide et
independant d'une panne de l'API Google.

Attention en production : SQLite ecrit dans un fichier. Sur un hebergeur conteneurise
(Railway, Render...), le disque est efface a chaque redeploiement, sauf si un volume
persistant est monte sur le dossier de SQLITE_PATH. Voir README.
"""
import sqlite3
from contextlib import contextmanager
from pathlib import Path

from .config import get_settings

SCHEMA = """
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    payer_name TEXT NOT NULL,
    payer_phone TEXT NOT NULL,
    amount REAL,
    currency TEXT NOT NULL DEFAULT 'XOF',
    method TEXT NOT NULL,
    installment_type TEXT NOT NULL DEFAULT 'full',
    reference TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    author_name TEXT NOT NULL,
    email TEXT,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    service_type TEXT,
    travel_period TEXT,
    approved INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS contact_messages (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'fr'
);

CREATE TABLE IF NOT EXISTS registrations (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    country TEXT,
    city TEXT,
    service_type TEXT NOT NULL,
    departure_date TEXT,
    notes TEXT,
    passport_valid_6_months INTEGER NOT NULL DEFAULT 0,
    language TEXT NOT NULL DEFAULT 'fr',
    drive_folder_link TEXT,
    status TEXT NOT NULL DEFAULT 'new'
);

CREATE TABLE IF NOT EXISTS departures (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    date TEXT NOT NULL,
    package_label TEXT NOT NULL,
    seats INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    image_url TEXT,
    image_file_id TEXT,
    active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS packages (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    name TEXT NOT NULL,
    duration TEXT,
    price TEXT,
    description TEXT,
    features TEXT NOT NULL DEFAULT '[]',
    image_url TEXT,
    image_file_id TEXT,
    active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    title TEXT NOT NULL,
    youtube_id TEXT NOT NULL,
    youtube_url TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_registrations_created ON registrations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_created ON contact_messages(created_at DESC);
"""


def _db_path() -> Path:
    path = Path(get_settings().sqlite_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


@contextmanager
def connect():
    conn = sqlite3.connect(_db_path())
    conn.row_factory = sqlite3.Row
    # WAL : lectures concurrentes sans blocage pendant une ecriture.
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    """Cree les tables manquantes. Appele au demarrage de l'API."""
    with connect() as conn:
        conn.executescript(SCHEMA)
