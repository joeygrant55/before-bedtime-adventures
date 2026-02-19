#!/usr/bin/env bash

set -u

SCRIPT_NAME="$(basename "$0")"
PROJECT_ROOT="/Users/joey/Desktop/Slateworks.io/before-bedtime-adventures"
DOMAIN="before-bedtime-adventures.vercel.app"
SITE_URL="https://$DOMAIN"
LULU_TOKEN_URL="https://api.lulu.com/auth/realms/glasstree/protocol/openid-connect/token"
ENV_FILE="$PROJECT_ROOT/.env.local"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

TOTAL_CHECKS=7
PASSED=0

if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  C_RESET='\033[0m'
  C_RED='\033[0;31m'
  C_GREEN='\033[0;32m'
  C_YELLOW='\033[1;33m'
else
  C_RESET=''
  C_RED=''
  C_GREEN=''
  C_YELLOW=''
fi

print_help() {
  cat <<EOF
Usage: $SCRIPT_NAME [options]

Checks launch readiness for Before Bedtime Adventures.

Options:
  --help    Show this help message

Return codes:
  0  Ready (all checks pass)
  1  Not ready (one or more checks failed)
EOF
}

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  print_help
  exit 0
fi

action_line() {
  local status_icon="$1"
  local status_color="$2"
  local message="$3"
  printf "%b%s %s%b\n" "$status_color" "$status_icon" "$message" "$C_RESET"
}

dotenv_get() {
  local file="$1"
  local key="$2"

  [ -f "$file" ] || return 1
  local line
  line=$(grep -E "^${key}=" "$file" 2>/dev/null | tail -n 1 | tr -d '\r' || true)
  [ -n "$line" ] || return 1

  local raw="${line#*=}"

  # Trim optional single/double quotes
  raw="${raw%#*}" # strip inline comments (best effort)
  raw="${raw#\"}"
  raw="${raw%\"}"
  raw="${raw#\'}"
  raw="${raw%\'}"

  printf '%s' "$raw"
  return 0
}

record_check() {
  local passed="$1"
  local icon
  local color
  if [ "$passed" -eq 1 ]; then
    PASSED=$((PASSED + 1))
    icon="✅"
    color="$C_GREEN"
  else
    icon="❌"
    color="$C_RED"
  fi

  local msg="$2"
  printf "%b%s %s%b\n" "$color" "$icon" "$msg" "$C_RESET"
}

check_http_status() {
  local url="$1"
  local out_body="$2"
  local out_headers="$3"

  curl -sS -L --max-time 15 -o "$out_body" -D "$out_headers" -w "%{http_code}" "$url"
}

# 1) Stripe key check
stripe_key="${STRIPE_SECRET_KEY:-}"
stripe_source="environment"
if [ -z "${stripe_key:-}" ]; then
  stripe_key=$(dotenv_get "$ENV_FILE" "STRIPE_SECRET_KEY" || true)
  stripe_source=".env.local"
fi

if [ -n "${stripe_key:-}" ] && [[ "$stripe_key" == sk_live_* ]]; then
  record_check 1 "Stripe: key found in $stripe_source (live mode)"
elif [ -n "${stripe_key:-}" ] && [[ "$stripe_key" == sk_test_* ]]; then
  record_check 0 "Stripe: key found in $stripe_source (test mode only: sk_test_*)"
elif [ -n "${stripe_key:-}" ]; then
  record_check 0 "Stripe: key found in $stripe_source but not recognized as live/test Stripe key"
else
  record_check 0 "Stripe: STRIPE_SECRET_KEY not set in environment or .env.local"
fi

# 2) Lulu credentials + token check
lulu_key="${LULU_CLIENT_KEY:-}"
lulu_secret="${LULU_CLIENT_SECRET:-}"
if [ -z "${lulu_key:-}" ]; then
  lulu_key=$(dotenv_get "$ENV_FILE" "LULU_CLIENT_KEY" || true)
fi
if [ -z "${lulu_secret:-}" ]; then
  lulu_secret=$(dotenv_get "$ENV_FILE" "LULU_CLIENT_SECRET" || true)
fi

lulu_token_ok=0
if [ -z "${lulu_key:-}" ] || [ -z "${lulu_secret:-}" ]; then
  lulu_msg="Lulu API: missing LULU_CLIENT_KEY and/or LULU_CLIENT_SECRET"
elif command -v curl >/dev/null 2>&1; then
  token_body="$TMP_DIR/lulu_body.txt"
  token_code=$(curl -sS -m 15 -o "$token_body" -X POST "$LULU_TOKEN_URL" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    --data "grant_type=client_credentials&client_id=$lulu_key&client_secret=$lulu_secret" \
    -w "%{http_code}" || true)

  if [ "$token_code" = "200" ] && grep -q '"access_token"' "$token_body"; then
    lulu_token_ok=1
    lulu_msg="Lulu API: credentials present and token request succeeded (HTTP $token_code)"
  else
    lulu_msg="Lulu API: token request failed (HTTP $token_code); check LULU credentials"
  fi
else
  lulu_msg="Lulu API: curl is not available"
fi
record_check "$lulu_token_ok" "$lulu_msg"

# 3) Domain/DNS + 200
# DNS
dns_ok=1
dns_ok=1
if command -v getent >/dev/null 2>&1; then
  getent hosts "$DOMAIN" >/dev/null 2>&1 || dns_ok=0
elif command -v nslookup >/dev/null 2>&1; then
  nslookup "$DOMAIN" >/dev/null 2>&1 || dns_ok=0
else
  dns_ok=0
fi

if [ "$dns_ok" -eq 1 ]; then
  domain_body="$TMP_DIR/domain_body.txt"
  domain_headers="$TMP_DIR/domain_headers.txt"
  http_code=$(check_http_status "$SITE_URL" "$domain_body" "$domain_headers")
  if [ "$http_code" = "200" ]; then
    record_check 1 "Domain/DNS: $DOMAIN resolves and responds 200"
  else
    record_check 0 "Domain/DNS: DNS resolved but $DOMAIN returned HTTP $http_code"
  fi
else
  record_check 0 "Domain/DNS: $DOMAIN does not resolve"
fi

# 4) Vercel deployment
if command -v curl >/dev/null 2>&1; then
  deploy_body="$TMP_DIR/deploy_body.txt"
  deploy_headers="$TMP_DIR/deploy_headers.txt"
  deploy_code=$(check_http_status "$SITE_URL" "$deploy_body" "$deploy_headers")

  if [ "$deploy_code" != "200" ]; then
    record_check 0 "Vercel deployment: HTTP check failed with $deploy_code"
  elif grep -qi '^x-vercel-id:' "$deploy_headers"; then
    record_check 1 "Vercel deployment: live and responding (HTTP 200)"
  else
    record_check 0 "Vercel deployment: site responds but does not appear to be served by Vercel"
  fi
else
  record_check 0 "Vercel deployment: curl is not available"
fi

# 5) Terms + Privacy
terms_ok=1
for path in /terms /privacy; do
  page_body="$TMP_DIR/page${path//\//_}_body.txt"
  page_headers="$TMP_DIR/page${path//\//_}_headers.txt"
  page_code=$(check_http_status "$SITE_URL$path" "$page_body" "$page_headers")
  if [ "$page_code" != "200" ]; then
    terms_ok=0
    break
  fi
done
if [ "$terms_ok" -eq 1 ]; then
  record_check 1 "Terms/Privacy: /terms and /privacy both return HTTP 200"
else
  record_check 0 "Terms/Privacy: one or both pages missing or not 200"
fi

# 6) Required env vars in .env.local
required_vars=(
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
  "CLERK_SECRET_KEY"
  "STRIPE_SECRET_KEY"
  "STRIPE_WEBHOOK_SECRET"
  "LULU_CLIENT_KEY"
  "LULU_CLIENT_SECRET"
  "CONVEX_DEPLOYMENT"
)

if [ ! -f "$ENV_FILE" ]; then
  record_check 0 "Environment vars: .env.local not found"
else
  missing=()
  for key in "${required_vars[@]}"; do
    val=$(dotenv_get "$ENV_FILE" "$key" || true)
    if [ -z "$val" ]; then
      missing+=("$key")
    fi
  done

  if [ "${#missing[@]}" -eq 0 ]; then
    record_check 1 "Environment vars: all required vars present in .env.local"
  else
    record_check 0 "Environment vars: missing ${#missing[@]} var(s): ${missing[*]}"
  fi
fi

# 7) Build check
if [ ! -d "$PROJECT_ROOT" ]; then
  record_check 0 "Build: project directory not found"
elif ! command -v npm >/dev/null 2>&1; then
  record_check 0 "Build: npm is not available"
else
  build_log="$TMP_DIR/build.log"
  if (cd "$PROJECT_ROOT" && npm run build >"$build_log" 2>&1); then
    record_check 1 "Build: npm run build passed"
  else
    code=$?
    record_check 0 "Build: npm run build failed (exit $code). See $build_log"
  fi
fi

printf "\nSummary: %b%d/%d checks passed%b\n" "$C_YELLOW" "$PASSED" "$TOTAL_CHECKS" "$C_RESET"

if [ "$PASSED" -eq "$TOTAL_CHECKS" ]; then
  exit 0
else
  exit 1
fi
