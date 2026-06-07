#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
AGENT_DIR="$ROOT_DIR/agent-py"

if command -v uv >/dev/null 2>&1; then
  exec uv --directory "$AGENT_DIR" run src/agent.py dev
fi

if [[ -x "$AGENT_DIR/.venv/bin/python" ]]; then
  cd "$AGENT_DIR"
  exec .venv/bin/python src/agent.py dev
fi

echo "error: need uv on PATH or agent-py/.venv (run: pnpm setup)" >&2
exit 1
