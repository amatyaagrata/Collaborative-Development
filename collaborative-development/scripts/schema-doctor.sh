#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SQL_FILE="$ROOT_DIR/COMPLETE_DATABASE_SETUP.sql"

MODE="${1:-all}"
ENV_FILE=""

log() { printf '%s\n' "$*"; }
err() { printf 'ERROR: %s\n' "$*" >&2; }

usage() {
  cat <<USAGE
Usage: $(basename "$0") [diagnose|repair|all] [env-file]

Modes:
  diagnose  Check Supabase connectivity and whether required public tables exist.
  repair    Run COMPLETE_DATABASE_SETUP.sql against database URL (psql required).
  all       Diagnose, then auto-repair if missing tables are found and DB URL is set.

Environment variables (from env file or shell):
  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY (recommended for diagnosis)
  NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY (fallback)
  SUPABASE_DB_URL or DATABASE_URL (required for auto-repair)
USAGE
}

if [[ "$MODE" == "-h" || "$MODE" == "--help" ]]; then
  usage
  exit 0
fi

if [[ "$MODE" != "diagnose" && "$MODE" != "repair" && "$MODE" != "all" ]]; then
  err "Invalid mode: $MODE"
  usage
  exit 1
fi

if [[ $# -ge 2 ]]; then
  ENV_FILE="$2"
elif [[ -f "$ROOT_DIR/.env" ]]; then
  ENV_FILE="$ROOT_DIR/.env"
elif [[ -f "$ROOT_DIR/.env.local" ]]; then
  ENV_FILE="$ROOT_DIR/.env.local"
fi

if [[ -n "$ENV_FILE" ]]; then
  if [[ ! -f "$ENV_FILE" ]]; then
    err "Env file not found: $ENV_FILE"
    exit 1
  fi
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
  log "Loaded env from: $ENV_FILE"
else
  log "No env file provided/found. Using current shell environment."
fi

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-}"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"
API_KEY="${SUPABASE_SERVICE_ROLE_KEY:-${NEXT_PUBLIC_SUPABASE_ANON_KEY:-${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY:-}}}"
DB_URL="${SUPABASE_DB_URL:-${DATABASE_URL:-}}"

REQUIRED_TABLES=(
  users
  categories
  suppliers
  organizations
  products
  orders
  order_items
  driver_assignments
  user_roles
  notifications
)

missing_tables=()

check_table() {
  local table="$1"
  local tmp code body
  tmp="$(mktemp)"
  code="$(curl -sS -o "$tmp" -w "%{http_code}" \
    "$SUPABASE_URL/rest/v1/$table?select=*&limit=1" \
    -H "apikey: $API_KEY" \
    -H "Authorization: Bearer $API_KEY")"
  body="$(cat "$tmp")"
  rm -f "$tmp"

  if [[ "$code" == "200" || "$code" == "206" ]]; then
    log "  [OK] $table"
    return 0
  fi

  if grep -qi "Could not find the table" <<<"$body"; then
    log "  [MISSING] $table"
    missing_tables+=("$table")
    return 0
  fi

  if [[ "$code" == "401" || "$code" == "403" ]]; then
    err "Auth failed checking '$table' (HTTP $code). Use SUPABASE_SERVICE_ROLE_KEY for diagnosis."
    err "Response: $body"
    return 2
  fi

  err "Unexpected response for '$table' (HTTP $code)."
  err "Response: $body"
  return 3
}

diagnose() {
  log "Running diagnosis..."

  if [[ -z "$SUPABASE_URL" ]]; then
    err "NEXT_PUBLIC_SUPABASE_URL is missing."
    return 1
  fi
  if [[ -z "$API_KEY" ]]; then
    err "No API key found. Set SUPABASE_SERVICE_ROLE_KEY (recommended) or anon/publishable key."
    return 1
  fi

  log "Supabase URL: $SUPABASE_URL"
  if [[ -n "$SERVICE_KEY" ]]; then
    log "Using service role key for checks."
  else
    log "Using non-service key for checks (may be limited by RLS)."
  fi

  local t
  for t in "${REQUIRED_TABLES[@]}"; do
    check_table "$t" || return $?
  done

  if [[ ${#missing_tables[@]} -eq 0 ]]; then
    log "Diagnosis complete: required tables are present."
  else
    log "Diagnosis complete: missing tables detected: ${missing_tables[*]}"
  fi
}

repair() {
  log "Running repair..."

  if [[ ! -f "$SQL_FILE" ]]; then
    err "Schema file not found: $SQL_FILE"
    return 1
  fi
  if [[ -z "$DB_URL" ]]; then
    err "SUPABASE_DB_URL or DATABASE_URL is required for auto-repair with psql."
    return 1
  fi
  if ! command -v psql >/dev/null 2>&1; then
    err "psql is not installed or not in PATH."
    return 1
  fi

  log "Applying schema SQL: $SQL_FILE"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$SQL_FILE"

  log "Requesting PostgREST schema cache reload..."
  psql "$DB_URL" -v ON_ERROR_STOP=1 -c "NOTIFY pgrst, 'reload schema';"

  log "Repair complete."
}

case "$MODE" in
  diagnose)
    diagnose
    ;;
  repair)
    repair
    ;;
  all)
    diagnose
    if [[ ${#missing_tables[@]} -gt 0 ]]; then
      log "Missing tables found. Attempting auto-repair..."
      if repair; then
        missing_tables=()
        diagnose
      else
        err "Auto-repair failed or skipped."
        err "If DB URL is unavailable, run COMPLETE_DATABASE_SETUP.sql manually in Supabase SQL Editor."
        exit 1
      fi
    else
      log "No repair needed."
    fi
    ;;
esac
