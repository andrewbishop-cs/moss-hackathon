#!/usr/bin/env bash
# Run backend Python via uv when available, else backend/.venv (Paul's machine may
# have .venv without uv on PATH).

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"

if command -v uv >/dev/null 2>&1; then
  exec uv --directory "$BACKEND_DIR" run python "$@"
fi

if [[ -x "$BACKEND_DIR/.venv/bin/python" ]]; then
  cd "$BACKEND_DIR"
  exec .venv/bin/python "$@"
fi

echo "error: need uv on PATH or backend/.venv (run: pnpm setup)" >&2
exit 1
