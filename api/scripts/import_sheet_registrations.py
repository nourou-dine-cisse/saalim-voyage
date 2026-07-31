"""
Reprise des inscriptions deja presentes dans la Google Sheet vers SQLite.

Depuis le passage a SQLite, l'onglet "Inscriptions" de l'admin lit la base et non
plus la feuille. Les inscriptions anterieures n'y figurent donc pas : ce script les
recopie une fois pour toutes. Il est sans risque a relancer (les doublons sont
ignores, sur la base du couple e-mail + date de creation).

    cd api
    source .venv/bin/activate
    python scripts/import_sheet_registrations.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db import connect, init_db  # noqa: E402
from app.sheets_service import list_registrations  # noqa: E402
from app.store import _new_id  # noqa: E402


def main():
    init_db()
    lignes = list_registrations()
    if not lignes:
        print("Aucune inscription trouvee dans la feuille.")
        return

    ajoutes = ignores = 0
    with connect() as conn:
        for r in lignes:
            existe = conn.execute(
                "SELECT 1 FROM registrations WHERE email = ? AND created_at = ?",
                (r.email, r.created_at),
            ).fetchone()
            if existe:
                ignores += 1
                continue

            conn.execute(
                """INSERT INTO registrations
                   (id, created_at, full_name, email, phone, whatsapp, country, city,
                    service_type, departure_date, notes, passport_valid_6_months,
                    language, drive_folder_link, status)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (
                    _new_id(), r.created_at, r.full_name, r.email, r.phone,
                    None, None, None, r.service_type, r.departure_date, None, 0,
                    "fr", r.drive_folder_link, "new",
                ),
            )
            ajoutes += 1

    print(f"Termine : {ajoutes} inscription(s) importee(s), {ignores} deja presente(s).")


if __name__ == "__main__":
    main()
