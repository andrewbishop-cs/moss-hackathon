#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"

if command -v uv >/dev/null 2>&1; then
  exec uv --directory "$BACKEND_DIR" run uvicorn src.main:app --port 8000
fi

if [[ -x "$BACKEND_DIR/.venv/bin/uvicorn" ]]; then
  cd "$BACKEND_DIR"
  exec .venv/bin/uvicorn src.main:app --port 8000
fi

echo "error: need uv on PATH or backend/.venv (run: pnpm setup)" >&2
exit 1
