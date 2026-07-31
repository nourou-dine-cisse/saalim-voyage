"""
À exécuter UNE SEULE FOIS, en local, pour obtenir le refresh token qui permettra
ensuite à l'API de créer des fichiers dans le Drive du compte Gmail de l'agence
(et non un compte de service, qui n'a pas de quota de stockage propre).

Pré-requis :
1. Un OAuth Client ID de type "Desktop app" créé dans Google Cloud Console
   (APIs & Services -> Credentials -> Create Credentials -> OAuth client ID).
2. L'écran de consentement OAuth configuré en mode "Testing", avec le compte
   Gmail de l'agence ajouté comme "Test user" (sinon Google refuse la connexion).
3. Le fichier JSON du client OAuth téléchargé et placé à côté de ce script,
   nommé "client_secret.json".

Utilisation :
    cd api
    source .venv/bin/activate
    python scripts/get_refresh_token.py

Une fenêtre de navigateur s'ouvre : connectez-vous avec le compte Gmail de
l'agence et acceptez l'accès à Drive/Sheets. Le script affiche ensuite le
refresh token à copier dans .env (GOOGLE_OAUTH_REFRESH_TOKEN), ainsi que le
client_id / client_secret correspondants.
"""
import json
from pathlib import Path

from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/spreadsheets",
]

CLIENT_SECRET_FILE = Path(__file__).parent / "client_secret.json"


def main():
    if not CLIENT_SECRET_FILE.exists():
        raise SystemExit(
            f"Fichier manquant : {CLIENT_SECRET_FILE}\n"
            "Téléchargez le JSON de votre OAuth Client ID (type Desktop app) "
            "depuis Google Cloud Console et placez-le ici sous ce nom."
        )

    with open(CLIENT_SECRET_FILE) as f:
        client_config = json.load(f)

    flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
    credentials = flow.run_local_server(port=0)

    print("\n=== Copiez ces valeurs dans api/.env ===\n")
    print(f"GOOGLE_OAUTH_CLIENT_ID={credentials.client_id}")
    print(f"GOOGLE_OAUTH_CLIENT_SECRET={credentials.client_secret}")
    print(f"GOOGLE_OAUTH_REFRESH_TOKEN={credentials.refresh_token}")
    print("\nGardez ces valeurs secrètes — ne les commitez jamais.")


if __name__ == "__main__":
    main()
