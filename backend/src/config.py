"""Environment + shared clients for the FastAPI hub.

Secrets live in ``agent-py/.env.local`` (LiveKit, Moss, Supabase, SIP) so the agent
and backend stay in sync. We load that as the base, then let an optional
``backend/.env`` override anything locally.
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from moss import MossClient
from supabase import Client, create_client

BACKEND_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BACKEND_DIR.parent

# Base env from the agent (has every key); backend/.env overrides if present.
load_dotenv(ROOT_DIR / "agent-py" / ".env.local")
load_dotenv(BACKEND_DIR / ".env", override=True)

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SECRET_KEY = os.environ["SUPABASE_SECRET_KEY"]
MOSS_PROJECT_ID = os.environ["MOSS_PROJECT_ID"]
MOSS_PROJECT_KEY = os.environ["MOSS_PROJECT_KEY"]

LEADS_INDEX = os.getenv("MOSS_LEADS_INDEX_NAME", "leads")
# Must match the agent's registered dispatch name (see agent-py/src/agent.py).
AGENT_NAME = os.getenv("AGENT_NAME", "agent-py")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

# Shared clients. supabase-py is sync; moss is async. LiveKit's API client is created
# per-call in calls.py because it owns an aiohttp session that must be closed.
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)
moss = MossClient(MOSS_PROJECT_ID, MOSS_PROJECT_KEY)
