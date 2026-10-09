"""
Index Google Sheets des inscriptions : c'est la source affichee dans l'admin,
et elle reste consultable directement dans Drive. L'onglet manquant est cree
automatiquement au premier usage.

(Departs, forfaits, lieux et videos vivent en SQLite — voir store.py.)
"""
from datetime import datetime, timezone
from typing import Iterable

from .config import get_settings
from .google_clients import get_sheets_client
from .schemas import RegistrationCreate, RegistrationIndexRow

REGISTRATIONS_HEADER = [
    "registration_id",
    "created_at",
    "full_name",
    "email",
    "phone",
    "service_type",
    "departure_date",
    "drive_folder_link",
]



def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _spreadsheet_id() -> str:
    return get_settings().registrations_index_sheet_id


def _tab_meta(tab: str) -> dict | None:
    """Retourne les metadonnees de l'onglet, ou None s'il n'existe pas."""
    sheets = get_sheets_client()
    meta = sheets.spreadsheets().get(spreadsheetId=_spreadsheet_id()).execute()
    for sheet in meta.get("sheets", []):
        props = sheet.get("properties", {})
        if props.get("title") == tab:
            return props
    return None


def ensure_tab(tab: str, header: list[str]) -> int:
    """Cree l'onglet avec sa ligne d'en-tete s'il n'existe pas. Retourne son sheetId."""
    props = _tab_meta(tab)
    if props:
        return props["sheetId"]

    sheets = get_sheets_client()
    result = (
        sheets.spreadsheets()
        .batchUpdate(
            spreadsheetId=_spreadsheet_id(),
            body={"requests": [{"addSheet": {"properties": {"title": tab}}}]},
        )
        .execute()
    )
    sheet_id = result["replies"][0]["addSheet"]["properties"]["sheetId"]
    sheets.spreadsheets().values().update(
        spreadsheetId=_spreadsheet_id(),
        range=f"{tab}!A1",
        valueInputOption="RAW",
        body={"values": [header]},
    ).execute()
    return sheet_id


def _append(tab: str, header: list[str], row: Iterable) -> None:
    ensure_tab(tab, header)
    get_sheets_client().spreadsheets().values().append(
        spreadsheetId=_spreadsheet_id(),
        range=f"{tab}!A:{chr(ord('A') + len(header) - 1)}",
        valueInputOption="RAW",
        insertDataOption="INSERT_ROWS",
        body={"values": [list(row)]},
    ).execute()


def _read(tab: str, header: list[str]) -> list[list[str]]:
    ensure_tab(tab, header)
    result = (
        get_sheets_client()
        .spreadsheets()
        .values()
        .get(
            spreadsheetId=_spreadsheet_id(),
            range=f"{tab}!A2:{chr(ord('A') + len(header) - 1)}",
        )
        .execute()
    )
    rows = result.get("values", [])
    return [row + [""] * (len(header) - len(row)) for row in rows]


def append_registration_row(registration_id: str, reg: RegistrationCreate, drive_folder_link: str) -> None:
    _append(
        get_settings().registrations_index_sheet_tab,
        REGISTRATIONS_HEADER,
        [
            registration_id,
            _now(),
            reg.full_name,
            reg.email,
            reg.phone,
            reg.service_type.value,
            reg.departure_date.isoformat() if reg.departure_date else "",
            drive_folder_link,
        ],
    )


def list_registrations() -> list[RegistrationIndexRow]:
    rows = _read(get_settings().registrations_index_sheet_tab, REGISTRATIONS_HEADER)
    out = [
        RegistrationIndexRow(
            id=r[0],
            created_at=r[1],
            full_name=r[2],
            email=r[3],
            phone=r[4],
            service_type=r[5],
            departure_date=r[6] or None,
            drive_folder_link=r[7],
        )
        for r in rows
    ]
    return list(reversed(out))  # les plus recentes en premier
