"""
Configuration centralisée de l'API, chargée depuis les variables d'environnement.
Ne jamais committer de vraies valeurs ici — voir .env.example pour le modèle attendu.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- Google Drive / Sheets ---
    # Authentification en tant que compte Gmail réel (OAuth), pas un compte de service :
    # un compte de service Google n'a aucun quota de stockage propre et ne peut donc
    # pas uploader de fichiers sur un compte Gmail personnel (hors Google Workspace).
    # google_service_account_json est conservé optionnel pour compatibilité, mais n'est
    # plus utilisé pour Drive/Sheets — voir google_clients.py.
    google_service_account_json: str = ""
    google_oauth_client_id: str
    google_oauth_client_secret: str
    google_oauth_refresh_token: str
    # ID du dossier Drive racine (dans le "Mon Drive" du compte authentifié),
    # dans lequel un sous-dossier sera créé par pèlerin.
    drive_root_folder_id: str
    # ID de la Google Sheet utilisée comme index rapide pour l'admin (une ligne par inscription).
    registrations_index_sheet_id: str
    registrations_index_sheet_tab: str = "Inscriptions"

    # --- Email admin ---
    smtp_host: str
    smtp_port: int = 587
    smtp_username: str
    smtp_password: str
    smtp_from: str
    admin_notification_email: str

    # --- Compte admin (authentification gérée par l'API, un seul compte) ---
    # Le mot de passe n'est jamais stocké en clair : ADMIN_PASSWORD_HASH contient une
    # empreinte générée par `python scripts/hash_password.py`.
    admin_email: str
    admin_password_hash: str
    # Clé de signature des jetons de session. Doit être longue et aléatoire, et
    # différente entre le développement local et la production.
    jwt_secret: str
    jwt_expire_minutes: int = 12 * 60

    # --- Base SQLite (paiements, avis, messages de contact) ---
    # En production, faire pointer ce chemin vers un volume persistant.
    sqlite_path: str = "./data/saalim.db"

    # --- CORS ---
    frontend_origin: str = "http://localhost:8080"

    # --- Divers ---
    environment: str = "development"


@lru_cache
def get_settings() -> Settings:
    return Settings()
