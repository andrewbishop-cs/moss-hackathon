#!/usr/bin/env bash
# Preflight for `pnpm dev`: kill any leftover agent workers so only ONE registers
# with LiveKit as "agent-py".
#
# Why: LiveKit Cloud load-balances explicit dispatches across EVERY worker that
# registers the same agent name. A stray worker from a previous (Ctrl+C'd but not
# fully reaped) `pnpm dev`, a `console` session, or a duplicate run will silently
# swallow ~half your calls — the dispatch lands on the ghost, so the phone never
# rings and no logs appear in the terminal you're watching. This kills them first.
#
# Scoped to this project's processes only: it matches `src/agent.py` (this repo's
# agent entry) and this repo's concurrently dev invocation. It will NOT touch
# unrelated projects (e.g. anything running `uvicorn main:app`).
#
# Runs automatically via the `predev` npm script. Safe to run by hand anytime.

# Patterns specific to this repo's dev processes.
patterns=(
  "src/agent.py"                          # agent worker (dev/start) + console sessions
  "uv --directory agent-py run"           # the uv launcher wrapping the agent
  "concurrently -n agent-py,backend,frontend"  # a leftover `pnpm dev` supervisor
)

killed=0
for pat in "${patterns[@]}"; do
  # pgrep -f matches against the full command line. Ignore our own PID.
  pids=$(pgrep -f "$pat" 2>/dev/null | grep -v "^$$\$" || true)
  for pid in $pids; do
    if kill "$pid" 2>/dev/null; then
      echo "[predev] killed stray process $pid ($pat)"
      killed=$((killed + 1))
    fi
  done
done

# Give them a moment, then force-kill any that ignored SIGTERM.
if [ "$killed" -gt 0 ]; then
  sleep 1
  for pat in "${patterns[@]}"; do
    pids=$(pgrep -f "$pat" 2>/dev/null | grep -v "^$$\$" || true)
    for pid in $pids; do
      kill -9 "$pid" 2>/dev/null && echo "[predev] force-killed $pid"
    done
  done
  echo "[predev] cleared $killed stray agent process(es)."
else
  echo "[predev] no stray agent processes — clean start."
fi

# Never fail the dev startup because cleanup found nothing to do.
exit 0
