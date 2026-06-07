#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
AGENT_DIR="$ROOT_DIR/agent-py"

# Guarantee per-call agent logs land on disk. LiveKit's job subprocess logs never
# make it back through concurrently's pipes, so tee/script can't capture them —
# the agent process writes them itself via this file (see _setup_file_logging in
# agent.py). Inherited by every forked job subprocess. Respect a caller-provided
# value so `pnpm dev:log` etc. can point it elsewhere.
LOG_DIR="$ROOT_DIR/logs"
mkdir -p "$LOG_DIR"
export AGENT_LOG_FILE="${AGENT_LOG_FILE:-$LOG_DIR/agent-$(date +%Y%m%d-%H%M%S).log}"
echo "[dev-agent] agent logs -> $AGENT_LOG_FILE" >&2

if command -v uv >/dev/null 2>&1; then
  exec uv --directory "$AGENT_DIR" run src/agent.py dev
fi

if [[ -x "$AGENT_DIR/.venv/bin/python" ]]; then
  cd "$AGENT_DIR"
  exec .venv/bin/python src/agent.py dev
fi

echo "error: need uv on PATH or agent-py/.venv (run: pnpm setup)" >&2
exit 1
