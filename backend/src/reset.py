"""Reset all leads to a clean pre-demo state.

Run directly (`uv --directory backend run python -m src.reset`) — it also runs
automatically at the start of `pnpm dev`. Best-effort: if Supabase is unreachable
we log and exit 0 so it never blocks the dev servers from starting.
"""

from __future__ import annotations

from src import db


def main() -> None:
    try:
        count = db.reset_leads()
        # NOTE: call history (the `calls` table) is intentionally NOT wiped for now
        # so transcripts persist across demo runs. Use db.reset_calls() to clear it.
        print(f"[reset] leads reset to pending: {count} (call history preserved)")
    except Exception as exc:  # noqa: BLE001 - never block `pnpm dev` on a reset hiccup
        print(f"[reset] skipped (could not reach Supabase): {exc}")


if __name__ == "__main__":
    main()
