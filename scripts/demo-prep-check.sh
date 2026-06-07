#!/usr/bin/env bash
# Pre-flight checks before a PSTN dry run or judge demo.
# Usage: ./scripts/demo-prep-check.sh

set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:8000}"
API_BASE_URL="${API_BASE_URL%/}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
AGENT_ENV="${AGENT_ENV:-agent-py/.env.local}"

pass=0
fail=0
warn=0

green() { printf '\033[32m✓ %s\033[0m\n' "$1"; pass=$((pass + 1)); }
red() { printf '\033[31m✗ %s\033[0m\n' "$1"; fail=$((fail + 1)); }
yellow() { printf '\033[33m⚠ %s\033[0m\n' "$1"; warn=$((warn + 1)); }
info() { printf '→ %s\n' "$1"; }

info "Demo prep pre-flight"
echo ""

# --- Services ---
info "Services"
code=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE_URL/health" 2>/dev/null || echo "000")
if [[ "$code" == "200" ]]; then green "Backend $API_BASE_URL (HTTP $code)"; else red "Backend not reachable at $API_BASE_URL"; fi

code=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/dashboard" 2>/dev/null || echo "000")
if [[ "$code" == "200" ]]; then green "Frontend $FRONTEND_URL (HTTP $code)"; else red "Frontend not reachable at $FRONTEND_URL"; fi

if pgrep -f "src/agent.py dev" >/dev/null 2>&1; then
  green "Agent worker running (agent.py dev)"
else
  red "Agent worker not running — start with: pnpm dev:agent-py"
fi
echo ""

# --- SIP env ---
info "SIP configuration ($AGENT_ENV)"
if [[ -f "$AGENT_ENV" ]]; then
  if grep -q '^SIP_OUTBOUND_TRUNK_ID=.\+' "$AGENT_ENV" 2>/dev/null; then
    trunk=$(grep '^SIP_OUTBOUND_TRUNK_ID=' "$AGENT_ENV" | cut -d= -f2 | tr -d '"')
    green "SIP_OUTBOUND_TRUNK_ID set ($trunk)"
  else
    red "SIP_OUTBOUND_TRUNK_ID missing — phone will not ring"
  fi
else
  red "$AGENT_ENV not found"
fi
echo ""

# --- Hero leads ---
info "Tier demo leads"
SMB_ID="b1000000-0016-0000-0000-000000000016"
WHALE_ID="b1000000-0001-0000-0000-000000000001"
leads=$(curl -s "$API_BASE_URL/leads" 2>/dev/null || echo "[]")
if echo "$leads" | jq -e 'type == "array"' >/dev/null 2>&1; then
  for id in "$SMB_ID" "$WHALE_ID"; do
    row=$(echo "$leads" | jq --arg id "$id" '.[] | select(.id == $id)')
    if [[ -n "$row" ]]; then
      name=$(echo "$row" | jq -r '.first_name + " " + .last_name')
      status=$(echo "$row" | jq -r '.status')
      phone=$(echo "$row" | jq -r '.phone')
      if [[ "$status" == "pending" ]]; then
        green "$name — status=$status phone=$phone"
      else
        yellow "$name — status=$status (reset with: pnpm reset:leads)"
      fi
    else
      red "Lead $id not found in GET /leads"
    fi
  done
else
  red "Could not fetch leads from $API_BASE_URL/leads"
fi
echo ""

# --- iPhone prep reminder ---
info "Manual steps (Paul)"
yellow "iPhone: Twilio caller in Contacts + Favorites"
yellow "iPhone: DND off for demo window, ringer on, volume up"
yellow "Answer phone during dry run — automated scripts cannot confirm PSTN audio"
echo ""

printf 'Results: %d passed, %d failed, %d warnings\n' "$pass" "$fail" "$warn"
[[ "$fail" -eq 0 ]]
