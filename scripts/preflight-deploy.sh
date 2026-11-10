#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"
FAILURES=0
COVERAGE_LOG="$(mktemp)"
trap 'rm -f "$COVERAGE_LOG"' EXIT

pass() { printf 'PASS: %s\n' "$1"; }
fail() { printf 'FAIL: %s\n' "$1" >&2; FAILURES=1; }
run_check() {
  local label="$1"; shift
  printf '\n== %s ==\n' "$label"
  if "$@"; then pass "$label"; else fail "$label"; fi
}

BRANCH="$(git branch --show-current)"
if [[ "$BRANCH" == fix/p1-security-remediation-* ]]; then pass "branch name: $BRANCH"; else fail "branch must be fix/p1-security-remediation-* (found: $BRANCH)"; fi

run_check "pnpm lint" pnpm lint
run_check "pnpm typecheck" pnpm typecheck
run_check "pnpm test" pnpm test

printf '\n== pnpm test:coverage ==\n'
if pnpm test:coverage 2>&1 | tee "$COVERAGE_LOG"; then
  COVERAGE_SUMMARY="$(grep -E 'All files|Statements|Lines' "$COVERAGE_LOG" | tail -n 3 || true)"
  if [[ -n "$COVERAGE_SUMMARY" ]]; then
    printf 'Coverage summary:\n%s\n' "$COVERAGE_SUMMARY"
    pass "coverage report generated"
  else
    fail "coverage report missing summary"
  fi
else
  fail "pnpm test:coverage"
fi

BUILD_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://build-placeholder.supabase.co}"
BUILD_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-build-placeholder-anon-key}"
run_check "pnpm build" env NEXT_BUILD_CPUS="${NEXT_BUILD_CPUS:-1}" NEXT_PUBLIC_SUPABASE_URL="$BUILD_SUPABASE_URL" NEXT_PUBLIC_SUPABASE_ANON_KEY="$BUILD_SUPABASE_ANON_KEY" pnpm build

printf '\n== secret-like values in diff ==\n'
if git diff --unified=0 main..HEAD -- . \
  | grep -Eiq '(^|[^A-Za-z0-9_])(sk_(live|test)_[A-Za-z0-9]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{20,}|AIza[0-9A-Za-z_-]{30,}|Bearer[[:space:]]+[A-Za-z0-9._-]{24,}|(RESEND_API_KEY|B2_UPLOAD_SIGNING_SECRET|TELEGRAM_BOT_TOKEN|SUPABASE_SERVICE_ROLE_KEY|GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY|CRON_SECRET|JOB_SECRET)[[:space:]]*[:=][[:space:]]*[^[:space:]]{24,})'; then
  fail "secret-like credential assignment found in git diff; inspect without printing values"
else
  pass "no secret-like credential values detected in git diff"
fi

printf '\n== migration files referenced by remediation report ==\n'
REPORT=".audit/P1_REMEDIATION_REPORT.md"
if [[ ! -f "$REPORT" ]]; then
  fail "$REPORT is missing"
else
  MIGRATIONS="$(grep -oE 'apps/web-platform/backend/supabase/migrations/[A-Za-z0-9_.-]+\.sql' "$REPORT" | sort -u || true)"
  if [[ -z "$MIGRATIONS" ]]; then
    fail "no migration paths listed in $REPORT"
  else
    while IFS= read -r migration; do
      [[ -z "$migration" ]] && continue
      if [[ -f "$migration" ]]; then pass "migration exists: $migration"; else fail "migration missing: $migration"; fi
    done <<< "$MIGRATIONS"
  fi
  REPORT_COMMIT="$(git log -1 --format='%H' -- "$REPORT")"
  HEAD_COMMIT="$(git rev-parse HEAD)"
  if [[ "$REPORT_COMMIT" == "$HEAD_COMMIT" ]]; then pass "remediation report is the branch tip"; else fail "remediation report is stale; latest report commit is not HEAD"; fi
fi

if [[ "$FAILURES" -ne 0 ]]; then
  printf '\nPreflight failed. Resolve all FAIL items before deployment.\n' >&2
  exit 1
fi
printf '\nPreflight passed. This does not replace staging smoke tests or manual approval.\n'
