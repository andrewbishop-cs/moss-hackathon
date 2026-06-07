#!/usr/bin/env bash
# Preflight for `pnpm dev`: kill leftover dev processes and free :8000 / :3000.
#
# Why agents: LiveKit load-balances across every worker registered as "agent-py".
# A stray worker swallows dispatches — phone never rings, no logs in your terminal.
#
# Why ports: killing concurrently does not always reap uvicorn/next children; the
# next `pnpm dev` then fails with "address already in use" and train:call sees no
# backend even though the agent started fine.

set -euo pipefail

free_port() {
  local port="$1"
  local pids
  pids=$(lsof -ti :"$port" 2>/dev/null || true)
  if [[ -z "$pids" ]]; then
    return 0
  fi
  for pid in $pids; do
    if kill "$pid" 2>/dev/null; then
      echo "[predev] freed :$port (killed pid $pid)"
    fi
  done
  sleep 0.5
  pids=$(lsof -ti :"$port" 2>/dev/null || true)
  for pid in $pids; do
    kill -9 "$pid" 2>/dev/null && echo "[predev] force-freed :$port (killed pid $pid)"
  done
}

# Patterns specific to this repo's dev processes.
patterns=(
  "src/agent.py"                          # agent worker (dev/start) + console sessions
  "uv --directory agent-py run"           # the uv launcher wrapping the agent
  "backend/.venv/bin/uvicorn src.main:app"  # backend without uv on PATH
  "uv --directory backend run uvicorn"    # backend via uv
  "concurrently -n agent-py,backend,frontend"  # leftover `pnpm dev` supervisor
)

killed=0
for pat in "${patterns[@]}"; do
  pids=$(pgrep -f "$pat" 2>/dev/null | grep -v "^$$\$" || true)
  for pid in $pids; do
    if kill "$pid" 2>/dev/null; then
      echo "[predev] killed stray process $pid ($pat)"
      killed=$((killed + 1))
    fi
  done
done

if [[ "$killed" -gt 0 ]]; then
  sleep 1
  for pat in "${patterns[@]}"; do
    pids=$(pgrep -f "$pat" 2>/dev/null | grep -v "^$$\$" || true)
    for pid in $pids; do
      kill -9 "$pid" 2>/dev/null && echo "[predev] force-killed $pid"
    done
  done
  echo "[predev] cleared $killed stray dev process(es)."
else
  echo "[predev] no stray dev processes — clean start."
fi

free_port 8000
free_port 3000

exit 0
