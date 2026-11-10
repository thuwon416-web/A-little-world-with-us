# P1 Security Remediation Report v2

**Branch:** `fix/p1-security-remediation-20261110`
**Base:** `main` at the branch point used for the original remediation (`df3c71162309825c40d36bc05bc0600aaa141faf`)
**Review scope:** P1-01 through P1-08, Phase A commit review, email provider completion, Drive orphan decision, and deploy-readiness package.

## Executive Summary

**Final recommendation: NOT-READY.** The code remediation and local test suite are in place, but the branch must not be deployed until staging validation and the blocking operational actions below are completed.

- All eight original P1 commits were reviewed line-by-line and scored in [`.audit/P1_COMMIT_REVIEW.md`](./P1_COMMIT_REVIEW.md). Follow-up commits address the review failures.
- P1-03 now has a real Resend adapter, startup configuration validation, an independent retryable email outbox, and a manual email test script. No live email was sent.
- P1-08 uses the documented Option C: read-only orphan retention with accepted-member authorization and durable audit events. It does **not** restore access to a private Google Drive file if the surviving partner has no pre-existing Drive permission.
- Four SQL migration files are committed but have **not** been applied to any database.
- No staging URL or staging credentials were available, so no staging endpoints were called. The staging smoke script safely skips without a staging URL.
- No Production environment variables, secrets, database data, dashboards, or deployments were changed. No PR was opened.

P1-07 remains an application-level mitigation until Ops restricts the Backblaze Application Key to the intended bucket and `couples/` prefix. The browser still receives a temporary B2 upload authorization token; the HMAC signature is checked by the app's verification endpoint, not by B2 itself.

## P1 Status Table

| P1 | Finding | Code | Tests | Manual actions | Risk if undeployed |
|---|---|---|---|---|---|
| P1-01 | Cron auth header mismatch | ✅ Shared helper sends `x-job-secret`; missing server configuration is 500 and invalid caller credentials are 401 | ✅ Helper tests cover missing/wrong/correct inbound auth and outbound header | Confirm Vercel `CRON_SECRET` or `JOB_SECRET` matches the Supabase Vault secret by hash | Medium |
| P1-02 | Missed-check-in retry state lost | ✅ Atomic claim/finalize/recovery RPCs and durable push outbox; migration required | ⚠️ Pure retry/ticket tests pass; Deno/Postgres integration not run | Apply migration #2 to staging; validate state transitions and Edge Function together | High |
| P1-03 | Emergency contact email never sent | ✅ Resend adapter, startup validation, email outbox, retry persistence, provider idempotency | ✅ Mocked Resend success/failure, missing-key boot validation, persistence/retry tests; no live send | Configure `EMAIL_PROVIDER`, `RESEND_API_KEY`, and `EMERGENCY_EMAIL_FROM` in staging Edge Function env; send controlled test | High |
| P1-04 | Location alert recipient wrong | ✅ Inviter/partner recipient selection corrected | ✅ Inviter, partner, and stranger cases | Deploy updated Edge Function after staging test | Low |
| P1-05 | Guardian indirect prompt injection | ✅ Retrieved context isolated and closing delimiter neutralized | ✅ Malicious text and delimiter-format tests; no live model behavior test | Seed malicious memory in staging and verify no instruction execution or disclosure | Medium |
| P1-06 | Telegram HTML injection | ✅ Dynamic title/details escaped at notification boundary | ✅ Helper and full notification payload tests | Send controlled `<b>` / `<script>` staging payload and verify literal rendering | Low |
| P1-07 | B2 upload authorization scope | ⚠️ Signed object metadata + post-upload verification is the requested fallback mitigation; B2 token itself remains bucket-scoped | ✅ HMAC/path/size/SHA tampering and route tests | Restrict/rotate Backblaze key to target bucket + `couples/` prefix; configure `B2_UPLOAD_SIGNING_SECRET` in staging Vercel | High |
| P1-08 | Drive media after owner deletion | ✅ Option C: read-only, accepted-member-gated, audited; owner marker and audit migrations required | ✅ Membership policy, allowed read, denied read/delete, audit insert, and roadmap stub tests | Apply migrations #1 and #4 to staging; confirm any partner read relies on pre-existing Google Drive permission | Medium |

## SQL Migrations — NOT APPLIED

Apply to staging first, validate, and only then consider Production after backup and human approval. Apply in filename order:

1. `apps/web-platform/backend/supabase/migrations/20261110090000_preserve_drive_media_access_after_owner_deletion.sql` — adds `owner_deleted_at` to memories/messages and the pre-delete owner marker trigger.
2. `apps/web-platform/backend/supabase/migrations/20261110091000_safety_notification_outbox.sql` — adds the push notification state columns/outbox, enqueue trigger, and atomic claim/finalize/recovery RPCs.
3. `apps/web-platform/backend/supabase/migrations/20261110092000_safety_email_outbox.sql` — creates and backfills the independent emergency email outbox.
4. `apps/web-platform/backend/supabase/migrations/20261110093000_drive_media_access_audit.sql` — creates the durable Drive media access audit table.

No migration was applied to staging or Production during this task.

## Phase A — Review Results

See [`.audit/P1_COMMIT_REVIEW.md`](./P1_COMMIT_REVIEW.md) for the original eight commit diffs and the rubric. The original report marked several items as partial/failing; follow-up commits were added without rewriting history.

- P1-01: outbound `x-job-secret` assertion added; missing server config distinguished from bad caller credentials.
- P1-02: check-in/outbox claim, finalize, and stale recovery made transactional through service-role RPCs.
- P1-03: placeholder adapter removed; real Resend delivery and a separately retryable email outbox added.
- P1-04: original recipient selector and tests retained.
- P1-05: actual line breaks and closing-delimiter neutralization added.
- P1-06: untrusted notification details escaped at the final HTML boundary.
- P1-07: signed metadata tamper tests added. The remaining B2 token-scope limitation is explicitly disclosed and requires Ops key restriction.
- P1-08: durable orphan access audit, non-member denial, null-owner delete denial, and Option C decision added.

The review does not claim that unit tests prove live provider behavior. Deno and real Supabase integration were unavailable in this run.

## Phase B — Emergency Email Provider

**Provider:** Resend (`https://api.resend.com/emails`).

The shared adapter is at `apps/web-platform/backend/supabase/functions/_shared/emailNotifier.ts`. It supports `ResendNotifier`, a test-only `NoopNotifier` that cannot be selected via `EMAIL_PROVIDER`, and a factory that fails at Edge Function startup if the Resend key or sender address is missing. Email work is stored in `safety_email_outbox` and retried independently of push delivery. Resend requests use a stable idempotency key based on check-in and contact IDs to reduce duplicate sends after worker crashes.

Required **staging Supabase Edge Function** environment:

```text
EMAIL_PROVIDER=resend
RESEND_API_KEY=<staging Resend API key>
EMERGENCY_EMAIL_FROM=<verified sender address>
```

The root `.env.example` contains blank placeholders only. `scripts/test-emergency-email.ts` accepts a recipient address through `Deno.args` and sends a test message using the configured provider. It was **not run**.

Test evidence:
- `email-notifier.test.ts`: 7 tests — provider default, missing key, missing sender, test-only no-op, unsupported provider, mocked Resend 200, non-2xx failure, recipient not logged.
- `email-notification-state.test.ts`: 7 tests — provider success, retryable failure, final failure, non-Error rejection, persisted delivered/pending state, and persistence failure propagation.
- Coverage for the isolated `emailNotifier.ts` and `email-notification-state.ts` modules: **100% statements, branches, functions, and lines** in the latest coverage run.

No email provider credential was configured or sent to Resend in this task.

## Phase C — Drive Orphan Decision

**Chosen option: C — keep orphaned couple media read-only and do not transfer ownership automatically.** See [`.audit/decisions/P1-08-drive-orphan.md`](./decisions/P1-08-drive-orphan.md).

- Only an accepted couple member can pass the application membership check.
- Non-members receive not-found responses; the file download method is not called, so file bytes are not returned.
- Orphaned media cannot be deleted through the app, including null-owner archived media.
- Read and denied-delete attempts are written to `drive_media_access_audit` with a distinct `drive_orphan_media_access` event type.
- Option A is a documented, unwired transfer roadmap stub at `apps/web-platform/backend/src/lib/drive-orphan-transfer.ts`.

**Access limitation:** Option C cannot grant Google Drive permission. If a file remains private in the deleted owner's Drive and the surviving partner was not already granted access, the partner cannot read its bytes. The app fails closed; it does not copy or transfer the file. This is a deliberate privacy decision, not a restored-access feature.

## Phase D — Deploy Readiness Package

- `scripts/preflight-deploy.sh` checks branch naming, lint, typecheck, tests, coverage summary, build, secret-like values in the diff, migration file existence, clean working tree, and that this report is the branch tip.
- `scripts/smoke-test-staging.ts` is staging-only. It refuses the Production hostname, prints no token values, and skips when staging inputs are missing. Cron checks are opt-in via `STAGING_ALLOW_CRON_SIDE_EFFECTS=true` because the existing GET cron route invokes a mutating Edge Function. The script uses GET, matching the route's actual method.
- `scripts/test-emergency-email.ts` is the manual email check; it was not run.
- [`.audit/DEPLOY_CHECKLIST.md`](./DEPLOY_CHECKLIST.md) contains the ordered staging, deploy-day, and rollback checklist.
- [`.audit/BLOCKERS.md`](./BLOCKERS.md) records the staging, provider, migration, B2 key-scope, and Guardian test-route blockers.

No staging URL or staging credentials were supplied. Therefore no staging request, staging deployment, live email, or live Drive/B2 verification occurred. The Guardian route in this repo does not expose a dedicated retrieved-memory test endpoint; the smoke script accepts an explicitly configured staging-only test URL, otherwise the Guardian check remains manual.

## Required Manual Actions — BLOCKING DEPLOY

- [ ] Provision or identify an isolated staging deployment and staging Supabase project; provide the staging URL and test accounts/IDs.
- [ ] Apply the four SQL migrations to staging in filename order: `20261110090000`, `20261110091000`, `20261110092000`, `20261110093000`. Verify them before any Production migration.
- [ ] Configure `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, and `EMERGENCY_EMAIL_FROM` in the **staging Supabase Edge Function** environment; verify the sender domain and run the controlled email test.
- [ ] Configure a high-entropy `B2_UPLOAD_SIGNING_SECRET` in **staging Vercel**. Never commit its value.
- [ ] Rotate/restrict the Backblaze Application Key to the required bucket and `couples/` name prefix, with minimum required capabilities. Until verified, P1-07 remains conditional.
- [ ] Verify `CRON_SECRET`/`JOB_SECRET` and the matching Supabase Vault job secret by comparing hashes only; never print either value.
- [ ] Run all staging smoke tests and manual tests in `.audit/DEPLOY_CHECKLIST.md`, including cron auth, B2 tamper 403, Telegram HTML rendering, Guardian malicious-memory behavior, and the Drive orphan matrix.
- [ ] Confirm the surviving partner's existing Google Drive permissions for the specific orphan files. If they are not shared, accept that Option C cannot restore access or schedule Option A as a separately approved project.
- [ ] Obtain two-engineer review and human approval before opening a PR or deploying. This task did not open a PR.
- [ ] On deploy day, take and verify a Production DB backup, then apply migrations in filename order and deploy only after staging passes.

## Rollback Plan

Rollback code by reverting the relevant P1 commit/fixup group and redeploying the prior application or Edge Function version. Avoid reverting only one side of a contract (for example, the cron wrapper without the Edge Function header expectation). Do not remove environment credentials as an automatic rollback step.

| P1 | Code rollback | Data/schema rollback guidance |
|---|---|---|
| P1-01 | Revert the cron helper/wrapper fix as a unit; do not mix old/new header contracts. | None. Keep the secret values unchanged and restore the matching header contract. |
| P1-02 | Roll back the Edge Function only after disabling the new handler behavior; keep pending outbox rows during initial rollback. | Migration #2 rollback SQL is below. Export/inspect pending rows before dropping the outbox. |
| P1-03 | Revert the Resend adapter/handler integration; retain pending email outbox rows for later retry. | Migration #3 rollback SQL is below. Export pending/failed rows before dropping the table. |
| P1-04 | Revert the recipient helper and Edge Function together. This restores the incorrect recipient behavior and is not recommended. | None. |
| P1-05 | Revert the Guardian helper/route only if necessary; doing so restores prompt-injection exposure and is not recommended. | None. |
| P1-06 | Prefer disabling Telegram notifications over reverting HTML escaping; reverting restores injection exposure. | None. |
| P1-07 | Stop new B2 uploads or revert upload/verify/client flow together; do not bypass verification. Keep the Backblaze key prefix restriction. | None. Preserve uploaded objects; reconcile any incomplete uploads before cleanup. |
| P1-08 | Disable the orphan read path if it behaves unexpectedly; retain audit events and ownership markers. | Migrations #1 and #4 rollback SQL below. Export audit records before removing the audit table. |

### Prepared SQL rollback snippets — NOT RUN

Apply only as a separately reviewed rollback migration, in reverse dependency order. Back up/export the relevant rows first. These snippets are not safe to run while the newer Edge Function or app code is deployed.

**Migration #4 — Drive access audit table** (export audit rows first):

```sql
DROP TABLE IF EXISTS public.drive_media_access_audit;
```

**Migration #3 — emergency email outbox** (export pending/failed email rows first):

```sql
DROP TABLE IF EXISTS public.safety_email_outbox;
```

**Migration #2 — safety notification outbox** (only after Migration #3 is rolled back):

```sql
DROP FUNCTION IF EXISTS public.recover_stale_safety_notifications(timestamptz);
DROP FUNCTION IF EXISTS public.set_safety_notification_state(uuid, public.safety_notification_status, integer, text);
DROP FUNCTION IF EXISTS public.claim_safety_notification(uuid);
DROP TRIGGER IF EXISTS safety_checkin_notification_outbox ON public.safety_checkins;
DROP FUNCTION IF EXISTS public.enqueue_missed_checkin_notification();
DROP TABLE IF EXISTS public.safety_notification_outbox;
ALTER TABLE public.safety_checkins
  DROP COLUMN IF EXISTS notification_status,
  DROP COLUMN IF EXISTS notification_attempts,
  DROP COLUMN IF EXISTS last_notification_error;
DROP TYPE IF EXISTS public.safety_notification_status;
```

**Migration #1 — Drive owner-deletion marker**:

```sql
DROP TRIGGER IF EXISTS mark_drive_media_owner_deleted_before_user_delete ON auth.users;
DROP FUNCTION IF EXISTS public.mark_drive_media_owner_deleted();
ALTER TABLE public.memories DROP COLUMN IF EXISTS owner_deleted_at;
ALTER TABLE public.messages DROP COLUMN IF EXISTS owner_deleted_at;
```

## Deploy Risk Assessment

| P1 | Risk | Why |
|---|---|---|
| P1-01 | Medium | Header contract is fixed in code, but Vercel/Vault values still require hash verification. |
| P1-02 | High | Safety push delivery depends on the migration and Edge Function deploying together; no staging DB integration was run. |
| P1-03 | High | Provider is implemented but Edge Function startup fails until the Resend key and verified sender are configured. |
| P1-04 | Low | Narrow recipient-selection correction with unit tests. |
| P1-05 | Medium | Prompt composition is hardened, but actual retrieved-memory/model behavior needs staging validation. |
| P1-06 | Low | Dynamic HTML fields are escaped; targeted tests pass. |
| P1-07 | High | The upload token remains bucket-scoped until Backblaze key restrictions are verified. |
| P1-08 | Medium | Option C is privacy-preserving but cannot restore Google Drive access to files not already shared with the partner. |

## Go / No-Go Recommendation

**GO only if all are true:**

- All four migrations have been applied and validated in staging in filename order.
- Staging email delivery succeeds with a verified Resend sender; failures persist and retry without logging recipient addresses.
- All three cron wrappers pass valid/invalid auth checks and the Vercel/Vault secret hashes match.
- Backblaze Application Key is restricted to the intended bucket and `couples/` prefix; tampered upload verification returns 403.
- Guardian injection, Telegram escaping, and the full Drive orphan matrix pass in staging.
- Two engineers approve the branch; Production backup and rollback SQL are reviewed.

**NO-GO if any are true:**

- Any migration is unapplied or staging state transitions fail.
- `RESEND_API_KEY` or verified sender is missing; email outbox cannot retry; or recipient PII appears in logs.
- Cron 401s persist due to a Vercel/Vault mismatch.
- Backblaze key scope is not prefix-restricted or a tampered object can be attached to a media record.
- A non-member can read/delete orphaned media, or the product assumes Option C restores access to a private Drive file.
- Staging validation, two-engineer review, or a verified Production backup is missing.

**After the 24-hour watch, success criteria:**

- Cron wrapper/Edge Function 401 rate is below 0.5% with no repeated secret-mismatch pattern.
- No safety email remains `processing` for more than 15 minutes; pending rows retry on schedule; failed rows are reviewed and actionable; delivered rows have provider acceptance confirmation.
- Push notifications are counted delivered only when Expo tickets confirm success; no repeated duplicate alert pattern appears.
- B2 legitimate uploads verify successfully, tampered names/metadata return 403, and no unexpected object-prefix uploads are observed.
- Drive audit trail shows no allowed access for non-members and no successful orphan deletion; partner reads are consistent with actual Drive sharing.
- Telegram HTML payloads render untrusted tags literally; Guardian malicious memory does not cause instruction execution or data disclosure.

## Verification Evidence

| Check | Latest result |
|---|---|
| `pnpm lint` | **Passed** — 0 errors, 26 warnings. |
| `pnpm typecheck` | **Passed**. |
| `pnpm test` | **Passed** — 55 test files, 214 tests. |
| `pnpm test:coverage` | **Passed** — 12.77% statements, 12.64% branches, 8.74% functions, 13.62% lines overall. The newly isolated `emailNotifier.ts`, `email-notification-state.ts`, `drive-orphan-transfer.ts`, and `cronAuth.ts` modules each report 100% statements/branches/functions/lines. Overall repository coverage remains low and is not represented as 100%. |
| `pnpm build` | Passed in the earlier Phase D run using dummy public Supabase build-time values and `NEXT_BUILD_CPUS=1`; the configurable CPU limit defaults to Next.js behavior when unset. Final post-report preflight reruns the build. |
| `scripts/smoke-test-staging.ts` | Exited with an explicit skip because `STAGING_BASE_URL` was absent; no network requests were made. |

Environment caveats: the available Node runtime is v25.9.0, while the package declares `>=24.3.0 <25`, so pnpm emits an engine warning. Deno CLI is unavailable in this environment; Deno-native Edge Function tests were not executed. No live Resend, Telegram, B2, Google Drive, Supabase staging, or Production request was made.

## Commit Inventory

There are 34 commits on the branch before this final report update. This report update is the 35th commit and is intended to be the final branch tip; the preflight script verifies that this report is at `HEAD`.


## Changed Files (complete inventory)

- `.audit/BLOCKERS.md`
- `.audit/DEPLOY_CHECKLIST.md`
- `.audit/P1_COMMIT_REVIEW.md`
- `.audit/P1_REMEDIATION_REPORT.md`
- `.audit/decisions/P1-08-drive-orphan.md`
- `.env.example`
- `.env.production.example`
- `apps/web-platform/backend/src/lib/drive-orphan-transfer.ts`
- `apps/web-platform/backend/supabase/functions/_shared/emailNotifier.ts`
- `apps/web-platform/backend/supabase/functions/check-missed-checkin/email-notification-state.ts`
- `apps/web-platform/backend/supabase/functions/check-missed-checkin/index.ts`
- `apps/web-platform/backend/supabase/functions/check-missed-checkin/notification-state.test.ts`
- `apps/web-platform/backend/supabase/functions/check-missed-checkin/notification-state.ts`
- `apps/web-platform/backend/supabase/functions/location-alerts/index.ts`
- `apps/web-platform/backend/supabase/functions/location-alerts/recipient.test.ts`
- `apps/web-platform/backend/supabase/functions/location-alerts/recipient.ts`
- `apps/web-platform/backend/supabase/migrations/20261110090000_preserve_drive_media_access_after_owner_deletion.sql`
- `apps/web-platform/backend/supabase/migrations/20261110091000_safety_notification_outbox.sql`
- `apps/web-platform/backend/supabase/migrations/20261110092000_safety_email_outbox.sql`
- `apps/web-platform/backend/supabase/migrations/20261110093000_drive_media_access_audit.sql`
- `apps/web-platform/frontend/next.config.js`
- `apps/web-platform/frontend/src/app/api/ai/guardian/route.ts`
- `apps/web-platform/frontend/src/app/api/cron/_lib/cronAuth.test.ts`
- `apps/web-platform/frontend/src/app/api/cron/_lib/cronAuth.ts`
- `apps/web-platform/frontend/src/app/api/cron/check-missed-checkin/route.ts`
- `apps/web-platform/frontend/src/app/api/drive/delete/route.test.ts`
- `apps/web-platform/frontend/src/app/api/drive/delete/route.ts`
- `apps/web-platform/frontend/src/app/api/drive/file/route.test.ts`
- `apps/web-platform/frontend/src/app/api/drive/file/route.ts`
- `apps/web-platform/frontend/src/app/api/media/b2-upload/route.test.ts`
- `apps/web-platform/frontend/src/app/api/media/b2-upload/route.ts`
- `apps/web-platform/frontend/src/app/api/media/b2-verify/route.test.ts`
- `apps/web-platform/frontend/src/app/api/media/b2-verify/route.ts`
- `apps/web-platform/frontend/src/app/api/telegram/register-webhook/route.test.ts`
- `apps/web-platform/frontend/src/app/api/telegram/register-webhook/route.ts`
- `apps/web-platform/frontend/src/features/chat/FileUpload.tsx`
- `apps/web-platform/frontend/src/lib/ai/untrusted-context.test.ts`
- `apps/web-platform/frontend/src/lib/ai/untrusted-context.ts`
- `apps/web-platform/frontend/src/lib/api/cron-helpers.test.ts`
- `apps/web-platform/frontend/src/lib/api/cron-helpers.ts`
- `apps/web-platform/frontend/src/lib/backblaze-b2.test.ts`
- `apps/web-platform/frontend/src/lib/backblaze-b2.ts`
- `apps/web-platform/frontend/src/lib/deploy-readiness-utils.test.ts`
- `apps/web-platform/frontend/src/lib/drive-orphan-transfer.test.ts`
- `apps/web-platform/frontend/src/lib/email-notification-state.test.ts`
- `apps/web-platform/frontend/src/lib/email-notifier.test.ts`
- `apps/web-platform/frontend/src/lib/google-drive-orphan-access.test.ts`
- `apps/web-platform/frontend/src/lib/google-drive-orphan-access.ts`
- `apps/web-platform/frontend/src/lib/google-drive.test.ts`
- `apps/web-platform/frontend/src/lib/google-drive.ts`
- `apps/web-platform/frontend/src/lib/location-alert-recipient.test.ts`
- `apps/web-platform/frontend/src/lib/safety-notification-state.test.ts`
- `apps/web-platform/frontend/src/lib/telegram.test.ts`
- `apps/web-platform/frontend/src/lib/telegram.ts`
- `apps/web-platform/frontend/vitest.config.ts`
- `scripts/deploy-readiness-utils.ts`
- `scripts/preflight-deploy.sh`
- `scripts/smoke-test-staging.ts`
- `scripts/test-emergency-email.ts`
