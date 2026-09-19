import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")


def get_setting(name: str, default: str | None = None) -> str | None:
    return os.getenv(name, default)


OLLAMA_BASE_URL = get_setting("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = get_setting("OLLAMA_MODEL", "llama3.2")
