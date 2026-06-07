"""File-backed call transcript storage for training data and replay."""

from __future__ import annotations

import json
from pathlib import Path
from uuid import UUID

TRANSCRIPT_DIR = Path(__file__).resolve().parent.parent / "data" / "transcripts"


def _lead_dir(lead_id: str | UUID) -> Path:
    return TRANSCRIPT_DIR / str(lead_id)


def save_transcript(payload: dict) -> Path:
    lead_id = str(payload["lead_id"])
    room_name = str(payload.get("room_name", "unknown"))
    target_dir = _lead_dir(lead_id)
    target_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{room_name}.json".replace("/", "_")
    path = target_dir / filename
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return path


def get_latest_transcript(lead_id: str | UUID) -> dict | None:
    lead_path = _lead_dir(lead_id)
    if not lead_path.is_dir():
        return None
    files = sorted(lead_path.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
    if not files:
        return None
    return json.loads(files[0].read_text(encoding="utf-8"))
