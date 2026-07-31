"""Extraction de l'identifiant YouTube depuis les differentes formes d'URL."""
import re

PATTERNS = [
    r"(?:youtube\.com/watch\?(?:.*&)?v=)([A-Za-z0-9_-]{11})",
    r"(?:youtu\.be/)([A-Za-z0-9_-]{11})",
    r"(?:youtube\.com/embed/)([A-Za-z0-9_-]{11})",
    r"(?:youtube\.com/shorts/)([A-Za-z0-9_-]{11})",
    r"(?:youtube\.com/live/)([A-Za-z0-9_-]{11})",
]


def extract_youtube_id(url: str) -> str | None:
    """Accepte une URL complete ou directement un identifiant de 11 caracteres."""
    url = (url or "").strip()
    if re.fullmatch(r"[A-Za-z0-9_-]{11}", url):
        return url
    for pattern in PATTERNS:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None
