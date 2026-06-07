#!/usr/bin/env bash
# Dry-run the tier demo click path (SMB + Whale UC2 triggers).
#
# Prerequisites:
#   - pnpm dev:backend (:8000), pnpm dev:agent-py, pnpm dev:frontend (:3000)
#   - Run backend/seed/reset_demo_leads.sql in Supabase if leads are stuck on `calling`
#   - Hero phone set via backend/seed/setup_tier_demo.sql
#
# Usage:
#   ./scripts/dry-run-tier-demo.sh           # SMB then Whale
#   ./scripts/dry-run-tier-demo.sh --whale   # Whale only (tight-time variant)

set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:8000}"
API_BASE_URL="${API_BASE_URL%/}"
SMB_ID="b1000000-0016-0000-0000-000000000016"
WHALE_ID="b1000000-0001-0000-0000-000000000001"
WHALE_ONLY="${1:-}"

green() { printf '\033[32m✓ %s\033[0m\n' "$1"; }
red() { printf '\033[31m✗ %s\033[0m\n' "$1"; }
info() { printf '→ %s\n' "$1"; }

if ! command -v curl >/dev/null 2>&1 || ! command -v jq >/dev/null 2>&1; then
  red "curl and jq are required"
  exit 1
fi

info "Smoke check"
./scripts/smoke-backend.sh
echo ""

trigger_estimate() {
  local id="$1"
  local savings="$2"
  local label="$3"
  info "POST /triggers/estimate-completed — $label ($id)"
  local body
  body=$(jq -n --arg id "$id" --argjson savings "$savings" '{ lead_id: $id, savings_total: $savings }')
  local resp
  resp=$(curl -s -X POST "$API_BASE_URL/triggers/estimate-completed" \
    -H "Content-Type: application/json" -d "$body")
  local status room
  status=$(echo "$resp" | jq -r '.lead.status // "error"')
  room=$(echo "$resp" | jq -r '.room_name // ""')
  if [[ -n "$room" && "$status" == "calling" ]]; then
    green "$label dispatched — status=$status room=$room"
    echo "  Live view: http://localhost:3000/dashboard/calls/$id"
  else
    red "$label dispatch failed — $(echo "$resp" | jq -c '.')"
    return 1
  fi
}

if [[ "$WHALE_ONLY" != "--whale" ]]; then
  trigger_estimate "$SMB_ID" 2760 "SMB (Alex Rivera · Beacon Labs)"
  echo ""
  sleep 2
fi

trigger_estimate "$WHALE_ID" 1583000 "Whale (Michael Truell · Cursor)"
echo ""

info "Final statuses"
curl -s "$API_BASE_URL/leads" | jq --arg smb "$SMB_ID" --arg whale "$WHALE_ID" \
  '[.[] | select(.id == $smb or .id == $whale) | {name: (.first_name + " " + .last_name), status, room_name, spend: .company.spend_total}]'

echo ""
info "Before the next dry run, reset stuck leads in Supabase:"
echo "  backend/seed/reset_demo_leads.sql"
