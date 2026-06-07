#!/usr/bin/env bash
# Resettable training-call launcher for Paul.
#
# Resets lead statuses before each call so Paul can retest without leads stuck on
# `calling`. Does NOT kill the dev stack — keep `pnpm dev` running in another
# terminal. (Killing agents also kills `pnpm dev`'s concurrently supervisor.)
# Use `pnpm train:reset` for a full kill + reset when things are stuck.
#
# Transcripts are written to Supabase when the agent shuts down; use --wait to
# block until one lands in the DB.
#
# Prerequisites: `pnpm dev` running in another terminal. Run `pnpm demo:check`
# if unsure.
#
# Usage:
#   ./scripts/train-call.sh                 # reset leads + call Michael (whale)
#   ./scripts/train-call.sh --smb           # Alex Rivera (SMB)
#   ./scripts/train-call.sh --wait          # block until transcript saved
#   ./scripts/train-call.sh --no-reset      # trigger only (lead already pending)
#   ./scripts/train-call.sh --check         # reset + demo:check only
#   ./scripts/train-call.sh --reset-only    # reset leads only, no call

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

API_BASE_URL="${API_BASE_URL:-http://localhost:8000}"
API_BASE_URL="${API_BASE_URL%/}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

SMB_ID="b1000000-0016-0000-0000-000000000016"
WHALE_ID="b1000000-0001-0000-0000-000000000001"

LEAD_ID="$WHALE_ID"
LEAD_LABEL="Michael Truell (Whale · Cursor)"
DO_RESET=1
DO_KILL=0
DO_WAIT=0
DO_CHECK=0
RESET_ONLY=0
SHOW_DOUBLE_DIAL=1

green() { printf '\033[32m✓ %s\033[0m\n' "$1"; }
red() { printf '\033[31m✗ %s\033[0m\n' "$1"; }
yellow() { printf '\033[33m⚠ %s\033[0m\n' "$1"; }
info() { printf '→ %s\n' "$1"; }

usage() {
  cat <<'EOF'
Usage: train-call.sh [options]

Options:
  --whale          Call Michael Truell (default)
  --smb            Call Alex Rivera (SMB)
  --lead-id ID     Call a specific lead UUID
  --wait           Poll until the call ends and a transcript is in the DB
  --no-reset       Skip reset:leads (lead already pending)
  --kill           Also run kill:agents (only if dev stack is NOT running)
  --check          Reset + demo:check, then exit
  --reset-only     Reset leads only (no call)
  --no-double-dial-hint  Skip the auto-retry / DND instructions
  -h, --help       Show this help

Transcripts are stored in Supabase (`calls.transcript`) and locally under
agent-py/export/transcripts/ when the agent session ends.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --whale) LEAD_ID="$WHALE_ID"; LEAD_LABEL="Michael Truell (Whale · Cursor)"; shift ;;
    --smb) LEAD_ID="$SMB_ID"; LEAD_LABEL="Alex Rivera (SMB · Beacon Labs)"; shift ;;
    --lead-id) LEAD_ID="$2"; LEAD_LABEL="lead $2"; shift 2 ;;
    --wait) DO_WAIT=1; shift ;;
    --no-reset) DO_RESET=0; shift ;;
    --kill) DO_KILL=1; shift ;;
    --no-kill) DO_KILL=0; shift ;;
    --check) DO_CHECK=1; shift ;;
    --reset-only) RESET_ONLY=1; shift ;;
    --no-double-dial-hint) SHOW_DOUBLE_DIAL=0; shift ;;
    -h|--help) usage; exit 0 ;;
    *) red "Unknown option: $1"; usage; exit 1 ;;
  esac
done

if ! command -v curl >/dev/null 2>&1 || ! command -v jq >/dev/null 2>&1; then
  red "curl and jq are required"
  exit 1
fi

info "Training call preflight"
echo ""

if [[ "$DO_KILL" -eq 1 ]]; then
  bash scripts/kill-stray-agents.sh
  echo ""
fi

if [[ "$DO_RESET" -eq 1 ]]; then
  bash scripts/lib/backend-run.sh -m src.reset
  echo ""
fi

if [[ "$DO_CHECK" -eq 1 || "$RESET_ONLY" -eq 1 ]]; then
  bash scripts/demo-prep-check.sh || true
  echo ""
fi

if [[ "$DO_CHECK" -eq 1 || "$RESET_ONLY" -eq 1 ]]; then
  if [[ "$RESET_ONLY" -eq 1 ]]; then
    green "Reset complete — ready for the next call"
  else
    green "Pre-flight complete"
  fi
  exit 0
fi

code=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE_URL/health" 2>/dev/null || echo "000")
if [[ "$code" != "200" ]]; then
  red "Backend not reachable at $API_BASE_URL"
  if lsof -ti :8000 >/dev/null 2>&1; then
    yellow "Port 8000 is in use but /health failed — zombie backend. In Terminal 1: Ctrl+C, then pnpm dev"
  else
    yellow "Start the stack in another terminal: pnpm dev"
    yellow "Wait for: Uvicorn running on http://127.0.0.1:8000 (not 'address already in use')"
  fi
  exit 1
fi

if ! pgrep -f "src/agent.py dev" >/dev/null 2>&1; then
  red "Agent worker not running — start with: pnpm dev:agent-py (or pnpm dev)"
  exit 1
fi

if [[ "$SHOW_DOUBLE_DIAL" -eq 1 ]]; then
  info "Double-dial / auto-retry"
  yellow "Let call #1 go to voicemail if testing retry — Alex logs no_answer and rings back once"
  yellow "iPhone: Twilio caller in Favorites, DND on, Repeated Calls ON, ringer up"
  echo ""
fi

info "Triggering call — $LEAD_LABEL"
body=$(jq -n --arg id "$LEAD_ID" '{ lead_id: $id }')
resp=$(curl -s -X POST "$API_BASE_URL/calls/trigger" \
  -H "Content-Type: application/json" -d "$body")

room=$(echo "$resp" | jq -r '.room_name // empty')
if [[ -z "$room" ]]; then
  red "Call dispatch failed — $(echo "$resp" | jq -c '.')"
  exit 1
fi

green "Dispatched — room=$room"
echo "  Live view: $FRONTEND_URL/dashboard/calls/$LEAD_ID"
echo "  Transcript API: $API_BASE_URL/leads/$LEAD_ID/transcript"
echo ""

if [[ "$DO_WAIT" -eq 0 ]]; then
  info "Transcript saves when the call ends (agent shutdown). Re-run with --wait to block."
  exit 0
fi

info "Waiting for call to finish and transcript to land in the DB (timeout 15 min)..."
deadline=$((SECONDS + 900))
last_status="calling"
retry_seen=0

while [[ "$SECONDS" -lt "$deadline" ]]; do
  lead_json=$(curl -s "$API_BASE_URL/leads/$LEAD_ID")
  status=$(echo "$lead_json" | jq -r '.status // "unknown"')
  if [[ "$status" != "$last_status" ]]; then
    info "Lead status: $last_status -> $status"
    last_status="$status"
  fi

  calls_json=$(curl -s "$API_BASE_URL/leads/$LEAD_ID/calls")
  active=$(echo "$calls_json" | jq '[.[] | select(.status == "calling")] | length')
  retries=$(echo "$calls_json" | jq '[.[] | select(.is_retry == true)] | length')
  if [[ "$retries" -gt 0 && "$retry_seen" -eq 0 ]]; then
    green "Auto-retry dispatched (double dial)"
    retry_seen=1
  fi

  tx_json=$(curl -s "$API_BASE_URL/leads/$LEAD_ID/transcript")
  tx=$(echo "$tx_json" | jq '.transcript')
  if [[ "$tx" != "null" && -n "$tx" && "$active" -eq 0 ]]; then
    turns=$(echo "$tx" | jq 'if .turns then (.turns | length) elif .items then (.items | length) else 0 end')
    call_id=$(echo "$calls_json" | jq -r '.[0].id // empty')
    green "Transcript saved — $turns turn(s), lead status=$status"
    if [[ -n "$call_id" ]]; then
      echo "  Per-call transcript: $API_BASE_URL/calls/$call_id/transcript"
    fi
    exit 0
  fi

  sleep 3
done

red "Timed out waiting for transcript — check agent logs and $FRONTEND_URL/dashboard/calls/$LEAD_ID"
exit 1
