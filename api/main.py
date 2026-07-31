from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from google.auth.exceptions import TransportError
from googleapiclient.errors import HttpError

from app.config import get_settings
from app.db import init_db
from app.routes import auth_routes, content, data_routes, registrations

settings = get_settings()

app = FastAPI(title="Saalim Voyages API", version="0.1.0")

# FRONTEND_ORIGIN accepte plusieurs origines separees par des virgules, pour couvrir
# a la fois le dev local et le domaine Vercel (+ ses previews) une fois deploye.
allowed_origins = [o.strip() for o in settings.frontend_origin.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    # Tout port local (dev) + tous les domaines Vercel (previews incluses).
    allow_origin_regex=r"^(https://.*\.vercel\.app|http://(localhost|127\.0\.0\.1)(:\d+)?)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

app.include_router(auth_routes.router)
app.include_router(registrations.router)
app.include_router(content.router)
app.include_router(data_routes.router)


@app.exception_handler(TransportError)
async def google_unreachable(_: Request, exc: TransportError):
    """
    Les services Google (Drive/Sheets) sont injoignables : coupure reseau, DNS,
    proxy... On renvoie un message clair plutot qu'une erreur 500 opaque.
    """
    return JSONResponse(
        status_code=503,
        content={
            "detail": "Services Google injoignables (Drive/Sheets). "
            "Verifiez la connexion Internet du serveur, puis reessayez."
        },
    )


@app.exception_handler(HttpError)
async def google_api_error(_: Request, exc: HttpError):
    """Erreur renvoyee par Google (droits insuffisants, quota, ressource absente)."""
    return JSONResponse(
        status_code=502,
        content={"detail": f"Erreur Google Drive/Sheets : {exc.reason or exc}"},
    )


@app.get("/health")
def health():
    return {"status": "ok"}
