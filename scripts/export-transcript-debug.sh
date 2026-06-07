#!/usr/bin/env bash
# Bundle transcript-related state for debugging persistence issues.
#
# Captures API snapshots (when backend is up), local transcript files, process
# checks, and a short summary. Safe to run while pnpm dev is up or down.
#
# Usage:
#   ./scripts/export-transcript-debug.sh
#   ./scripts/export-transcript-debug.sh --lead-id b1000000-0001-0000-0000-000000000001
#   ./scripts/export-transcript-debug.sh --room call-b1000000-1780817950

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

API_BASE_URL="${API_BASE_URL:-http://localhost:8000}"
API_BASE_URL="${API_BASE_URL%/}"
WHALE_ID="b1000000-0001-0000-0000-000000000001"
LEAD_ID="$WHALE_ID"
ROOM_NAME=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --lead-id) LEAD_ID="$2"; shift 2 ;;
    --room) ROOM_NAME="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,12p' "$0"
      exit 0
      ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

if ! command -v curl >/dev/null 2>&1 || ! command -v jq >/dev/null 2>&1; then
  echo "error: curl and jq are required" >&2
  exit 1
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="$ROOT_DIR/agent-py/export/debug/transcript-debug-$STAMP"
mkdir -p "$OUT_DIR"/{api,local/agent-py-transcripts,local/backend-data-transcripts}

green() { printf '\033[32m✓ %s\033[0m\n' "$1"; }
yellow() { printf '\033[33m⚠ %s\033[0m\n' "$1"; }
info() { printf '→ %s\n' "$1"; }

info "Exporting transcript debug bundle → $OUT_DIR"

# --- process / env checks ---
{
  echo "exported_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "lead_id=$LEAD_ID"
  echo "room_name=${ROOM_NAME:-<not specified>}"
  echo "git_sha=$(git -C "$ROOT_DIR" rev-parse --short HEAD 2>/dev/null || echo unknown)"
  echo "git_branch=$(git -C "$ROOT_DIR" branch --show-current 2>/dev/null || echo unknown)"
  echo ""
  echo "=== processes ==="
  pgrep -fl "src/agent.py|uvicorn src.main" 2>/dev/null || echo "(none)"
  echo ""
  echo "=== ports ==="
  lsof -ti :8000 2>/dev/null && echo "port 8000: in use" || echo "port 8000: free"
  lsof -ti :3000 2>/dev/null && echo "port 3000: in use" || echo "port 3000: free"
} > "$OUT_DIR/process-check.txt"

# --- API snapshots (best-effort) ---
health_code=$(curl -s -o "$OUT_DIR/api/health.json" -w "%{http_code}" "$API_BASE_URL/health" 2>/dev/null || echo "000")
if [[ "$health_code" == "200" ]]; then
  green "Backend reachable — fetching API snapshots"
  curl -s "$API_BASE_URL/leads/$LEAD_ID" | jq '.' > "$OUT_DIR/api/lead.json"
  curl -s "$API_BASE_URL/leads/$LEAD_ID/calls" | jq '.' > "$OUT_DIR/api/calls.json"
  curl -s "$API_BASE_URL/leads/$LEAD_ID/transcript" | jq '.' > "$OUT_DIR/api/lead-transcript.json"

  # Per-call transcript endpoints for each attempt.
  call_ids=$(jq -r '.[].id // empty' "$OUT_DIR/api/calls.json" 2>/dev/null || true)
  if [[ -n "$call_ids" ]]; then
    mkdir -p "$OUT_DIR/api/call-transcripts"
    while IFS= read -r cid; do
      [[ -z "$cid" ]] && continue
      curl -s "$API_BASE_URL/calls/$cid/transcript" | jq '.' > "$OUT_DIR/api/call-transcripts/$cid.json"
    done <<< "$call_ids"
  fi
else
  yellow "Backend not reachable at $API_BASE_URL (health=$health_code)"
  echo "{\"error\":\"backend_unreachable\",\"health_code\":\"$health_code\"}" > "$OUT_DIR/api/health.json"
fi

# --- local transcript files ---
if [[ -d "$ROOT_DIR/agent-py/export/transcripts" ]]; then
  cp -R "$ROOT_DIR/agent-py/export/transcripts/." "$OUT_DIR/local/agent-py-transcripts/" 2>/dev/null || true
fi
if [[ -d "$ROOT_DIR/backend/data/transcripts" ]]; then
  cp -R "$ROOT_DIR/backend/data/transcripts/." "$OUT_DIR/local/backend-data-transcripts/" 2>/dev/null || true
fi

# --- room-specific lookup ---
if [[ -n "$ROOM_NAME" ]]; then
  {
    echo "room_name=$ROOM_NAME"
    echo ""
    echo "=== local agent-py match ==="
    find "$ROOT_DIR/agent-py/export/transcripts" -name "*${ROOM_NAME}*" 2>/dev/null || echo "(none)"
    echo ""
    echo "=== local backend/data match ==="
    find "$ROOT_DIR/backend/data/transcripts" -name "*${ROOM_NAME}*" 2>/dev/null || echo "(none)"
    if [[ -f "$OUT_DIR/api/calls.json" ]]; then
      echo ""
      echo "=== API call row ==="
      jq --arg room "$ROOM_NAME" '[.[] | select(.room_name == $room)]' "$OUT_DIR/api/calls.json" 2>/dev/null || true
    fi
  } > "$OUT_DIR/room-lookup.txt"
fi

# --- summary for humans ---
{
  echo "# Transcript debug export"
  echo ""
  echo "- **Exported:** $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "- **Lead:** \`$LEAD_ID\`"
  [[ -n "$ROOM_NAME" ]] && echo "- **Room:** \`$ROOM_NAME\`"
  echo "- **Backend:** $API_BASE_URL (health=$health_code)"
  echo ""
  echo "## Local transcript files (agent-py)"
  find "$OUT_DIR/local/agent-py-transcripts" -name '*.json' -print 2>/dev/null | sed 's|^| - |' || echo " - (none)"
  echo ""
  echo "## Local transcript files (backend/data)"
  find "$OUT_DIR/local/backend-data-transcripts" -name '*.json' -print 2>/dev/null | sed 's|^| - |' || echo " - (none)"
  echo ""
  if [[ -f "$OUT_DIR/api/calls.json" ]]; then
    echo "## API calls (newest first)"
    jq -r '.[] | "- \(.room_name) status=\(.status) ended=\(.ended_at // "null") has_transcript=\(.transcript // "check per-call endpoint")"' \
      "$OUT_DIR/api/calls.json" 2>/dev/null || true
    echo ""
    echo "Note: \`GET /leads/:id/calls\` omits transcript bodies — see \`api/call-transcripts/\`."
  fi
  echo ""
  echo "## Transcript persistence paths (code)"
  echo "1. **Agent shutdown (LiveKit history):** \`agent.py\` → \`POST /calls/transcript\` with \`session.history.to_dict()\`"
  echo "2. **Agent shutdown (event turns):** \`transcript_store.py\` → local \`agent-py/export/transcripts/\` + \`POST /calls/transcript\` with \`{turns: [...]}\`"
  echo "3. **Backend:** \`db.save_call_transcript(room_name)\` → Supabase \`calls.transcript\`"
  echo ""
  echo "## Common failure modes"
  echo "- Call interrupted before agent shutdown → no transcript written"
  echo "- \`train:call:wait\` Ctrl+C'd early → poll stopped, transcript may still land later"
  echo "- Backend down at shutdown → agent POST fails (logged as \`transcript write failed\`)"
  echo "- Duplicate shutdown callbacks: both history + event-based paths register in \`agent.py\`"
} > "$OUT_DIR/README.md"

green "Export complete"
echo "  $OUT_DIR"
echo "  Share README.md + api/ + local/ with Andrew for debugging"
