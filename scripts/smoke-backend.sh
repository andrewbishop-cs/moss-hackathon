#!/usr/bin/env bash
# Smoke-test the FastAPI hub at http://localhost:8000.
#
# Usage:
#   ./scripts/smoke-backend.sh              # read-only (GET /health, /leads, /leads/:id)
#   ./scripts/smoke-backend.sh --full       # also POST triggers (dispatches agent — side effects!)
#
# Env:
#   API_BASE_URL   default http://localhost:8000
#   DEMO_LEAD_ID   default b1000000-0001-0000-0000-000000000001 (Michael Truell, UC2, seed data)

set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:8000}"
API_BASE_URL="${API_BASE_URL%/}"
DEMO_LEAD_ID="${DEMO_LEAD_ID:-b1000000-0001-0000-0000-000000000001}"
FULL="${1:-}"

pass=0
fail=0

green() { printf '\033[32m✓ %s\033[0m\n' "$1"; }
red() { printf '\033[31m✗ %s\033[0m\n' "$1"; }
info() { printf '→ %s\n' "$1"; }

check_status() {
  local name="$1"
  local expected="$2"
  local actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    green "$name (HTTP $actual)"
    pass=$((pass + 1))
  else
    red "$name — expected HTTP $expected, got $actual"
    fail=$((fail + 1))
  fi
}

check_json_field() {
  local name="$1"
  local body="$2"
  local jq_expr="$3"
  if echo "$body" | jq -e "$jq_expr" >/dev/null 2>&1; then
    green "$name"
    pass=$((pass + 1))
  else
    red "$name — response missing expected field"
    fail=$((fail + 1))
  fi
}

curl_code() {
  local url="$1"
  local out="$2"
  local method="${3:-GET}"
  local data="${4:-}"
  local code
  if [[ -n "$data" ]]; then
    code=$(curl -s -o "$out" -w "%{http_code}" -X "$method" "$url" \
      -H "Content-Type: application/json" -d "$data" 2>/dev/null) || true
  else
    code=$(curl -s -o "$out" -w "%{http_code}" -X "$method" "$url" 2>/dev/null) || true
  fi
  echo "${code:-000}"
}

if ! command -v curl >/dev/null 2>&1; then
  red "curl is required"
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  red "jq is required (brew install jq)"
  exit 1
fi

info "API_BASE_URL=$API_BASE_URL"
echo ""

# --- GET /health ---
info "GET /health"
code=$(curl_code "$API_BASE_URL/health" /tmp/smoke-health.json)
check_status "GET /health" "200" "$code"
if [[ "$code" == "200" ]]; then
  check_json_field "/health returns ok" "$(cat /tmp/smoke-health.json)" '.ok == true'
fi
echo ""

# --- GET /leads ---
info "GET /leads"
code=$(curl_code "$API_BASE_URL/leads" /tmp/smoke-leads.json)
check_status "GET /leads" "200" "$code"
if [[ "$code" == "200" ]]; then
  count=$(jq 'length' /tmp/smoke-leads.json)
  if [[ "$count" -ge 1 ]]; then
    green "GET /leads returned $count lead(s)"
    pass=$((pass + 1))
  else
    red "GET /leads returned empty array — is seed data loaded?"
    fail=$((fail + 1))
  fi
  check_json_field "lead has nested company" "$(cat /tmp/smoke-leads.json)" '.[0].company.name'
fi
echo ""

# --- GET /leads/:id ---
info "GET /leads/$DEMO_LEAD_ID"
code=$(curl_code "$API_BASE_URL/leads/$DEMO_LEAD_ID" /tmp/smoke-lead.json)
check_status "GET /leads/:id" "200" "$code"
if [[ "$code" == "200" ]]; then
  check_json_field "lead has use_case" "$(cat /tmp/smoke-lead.json)" '.use_case'
  check_json_field "lead has company" "$(cat /tmp/smoke-lead.json)" '.company.name'
fi
echo ""

# --- CORS preflight (frontend origin) ---
info "OPTIONS /leads (CORS preflight from localhost:3000)"
code=$(curl -s -o /dev/null -w "%{http_code}" \
  -X OPTIONS "$API_BASE_URL/leads" \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" 2>/dev/null) || code="000"
code="${code:-000}"
if [[ "$code" == "200" || "$code" == "204" || "$code" == "405" ]]; then
  green "CORS preflight acceptable (HTTP $code)"
  pass=$((pass + 1))
else
  red "CORS preflight — got HTTP $code (frontend may be blocked)"
  fail=$((fail + 1))
fi
echo ""

if [[ "$FULL" != "--full" ]]; then
  info "Read-only checks done. Run with --full to POST triggers (dispatches agent)."
  if [[ "$code" == "000" ]] && [[ ! -s /tmp/smoke-health.json ]]; then
    echo ""
    red "Backend not reachable. Start it with: pnpm dev:backend"
  fi
  echo ""
  printf 'Results: %d passed, %d failed\n' "$pass" "$fail"
  [[ "$fail" -eq 0 ]] || exit 1
  exit 0
fi

echo "⚠️  --full mode: POST requests will dispatch the agent and may dial a phone."
echo ""

# --- POST /triggers/estimate-completed (UC2) ---
info "POST /triggers/estimate-completed"
uc2_body=$(jq -n --arg id "$DEMO_LEAD_ID" '{ lead_id: $id, savings_total: 195500 }')
code=$(curl_code "$API_BASE_URL/triggers/estimate-completed" /tmp/smoke-uc2.json POST "$uc2_body")
check_status "POST /triggers/estimate-completed" "200" "$code"
if [[ "$code" == "200" ]]; then
  check_json_field "UC2 response has room_name" "$(cat /tmp/smoke-uc2.json)" '.room_name | length > 0'
  check_json_field "UC2 response has lead" "$(cat /tmp/smoke-uc2.json)" '.lead.id'
fi
echo ""

# --- POST /calls/trigger ---
info "POST /calls/trigger"
call_body=$(jq -n --arg id "$DEMO_LEAD_ID" '{ lead_id: $id }')
code=$(curl_code "$API_BASE_URL/calls/trigger" /tmp/smoke-call.json POST "$call_body")
check_status "POST /calls/trigger" "200" "$code"
if [[ "$code" == "200" ]]; then
  check_json_field "Call trigger has room_name" "$(cat /tmp/smoke-call.json)" '.room_name | length > 0'
fi
echo ""

# --- POST /triggers/new-signup (UC1) — creates a new lead ---
info "POST /triggers/new-signup"
ts=$(date +%s)
uc1_body=$(jq -n --arg ts "$ts" '{
  first_name: "Demo",
  last_name: ("User" + $ts),
  email: ("demo+" + $ts + "@example.com"),
  phone: "+14155559999",
  company_name: "Smoke Test Co",
  company_size: "51-200",
  cloud_provider: "aws",
  timezone: "America/New_York"
}')
code=$(curl_code "$API_BASE_URL/triggers/new-signup" /tmp/smoke-uc1.json POST "$uc1_body")
check_status "POST /triggers/new-signup" "200" "$code"
if [[ "$code" == "200" ]]; then
  check_json_field "UC1 response has room_name" "$(cat /tmp/smoke-uc1.json)" '.room_name | length > 0'
  check_json_field "UC1 response has lead.company" "$(cat /tmp/smoke-uc1.json)" '.lead.company.name'
fi
echo ""

printf 'Results: %d passed, %d failed\n' "$pass" "$fail"
[[ "$fail" -eq 0 ]] || exit 1
