"""
Construction des clients Google (Drive + Sheets), authentifies en tant que compte
Gmail reel (OAuth avec refresh token) et non un compte de service : un compte de
service n'a pas de quota de stockage propre et ne peut pas deposer de fichiers sur
un compte personnel (hors Google Workspace / Drive partages). Le refresh token est
obtenu une seule fois via scripts/get_refresh_token.py — voir README.md.

IMPORTANT — thread-safety : FastAPI execute les endpoints synchrones dans un pool
de threads. Or ni httplib2.Http ni google.oauth2 Credentials ne sont thread-safe :
les partager provoque des corruptions memoire (segfault du processus). On garde
donc un jeu de clients distinct PAR THREAD via threading.local().
"""
import threading

import google_auth_httplib2
import httplib2
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from .config import get_settings

# Timeout explicite sur les appels Drive/Sheets : sans ca, une requete peut rester
# bloquee indefiniment si le reseau filtre silencieusement les paquets.
REQUEST_TIMEOUT_SECONDS = 15

SCOPES = [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/spreadsheets",
]

TOKEN_URI = "https://oauth2.googleapis.com/token"

_local = threading.local()


def _build_clients() -> tuple:
    settings = get_settings()
    credentials = Credentials(
        token=None,
        refresh_token=settings.google_oauth_refresh_token,
        token_uri=TOKEN_URI,
        client_id=settings.google_oauth_client_id,
        client_secret=settings.google_oauth_client_secret,
        scopes=SCOPES,
    )
    http = google_auth_httplib2.AuthorizedHttp(
        credentials, http=httplib2.Http(timeout=REQUEST_TIMEOUT_SECONDS)
    )
    drive = build("drive", "v3", http=http, cache_discovery=False)
    sheets = build("sheets", "v4", http=http, cache_discovery=False)
    return drive, sheets


def _clients() -> tuple:
    clients = getattr(_local, "clients", None)
    if clients is None:
        clients = _build_clients()
        _local.clients = clients
    return clients


def get_drive_client():
    return _clients()[0]


def get_sheets_client():
    return _clients()[1]
