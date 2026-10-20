"""
storage.py — Supabase Storage client initialisation.

A single lazily-created client is shared across the process lifetime so
that repeated requests do not re-establish the connection.  Only the
service-role key is used here; it never leaves the backend.
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from supabase import Client, create_client

# Resolve .env relative to this file so it works from any CWD (BUG-13)
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SUPABASE_URL: str | None = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY: str | None = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Name of the private Supabase Storage bucket.
STORAGE_BUCKET = "incident-images"

# ---------------------------------------------------------------------------
# Lazy singleton
# ---------------------------------------------------------------------------

_client: Client | None = None


def get_supabase() -> Client:
    """Return the shared Supabase client, creating it on first call."""
    global _client
    if _client is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set "
                "in the .env file before using Supabase Storage."
            )
        _client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    return _client
