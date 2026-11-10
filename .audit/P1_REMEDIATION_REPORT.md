# P1 Security Remediation Report

**Branch:** `fix/p1-security-remediation-20261110`  
**Base:** `df3c71162309825c40d36bc05bc0600aaa141faf`  
**Scope:** P1 findings 01–08. No Production environment values, secrets, dashboards, or database data were changed. SQL migrations are committed as files only and were not applied.

## Executive status

The branch contains code changes for all eight findings, tests, two unapplied Supabase migrations, and this report. This is **not yet Production-deployable** until the manual actions below are completed.

Three items remain conditional/partial:
- **P1-03:** no email provider exists in the repository. The requested fail-loud adapter was added; emergency-contact email still cannot be delivered until a provider is configured and integrated.
- **P1-07:** signed object authorization and post-upload B2 verification are implemented. Direct B2 upload still exposes a temporary bucket upload token; Operations must restrict/rotate the Backblaze application key to the `couples/` prefix.
- **P1-08:** orphan records are recognized and restricted to accepted couple members, read-only. Access to a file owned by a deleted Google account still depends on the surviving partner having Drive access to that file; account deletion can remove the original Drive connection.

## Finding matrix

| P1-ID | Status | Files changed | Tests added | Manual actions required |
|---|---|---|---|---|
| P1-01 | **Code fixed** | `frontend/src/app/api/cron/_lib/cronAuth.ts`, three cron routes, `frontend/src/lib/api/cron-helpers.ts` | cronAuth + cron helper tests: missing/wrong secret rejected; correct secret accepted | Ensure Vercel `CRON_SECRET` (or `JOB_SECRET`) matches the corresponding Supabase Vault job secret. No values were read or changed. |
| P1-02 | **Code + migration ready; manual apply** | `backend/supabase/functions/check-missed-checkin/index.ts`, `notification-state.ts`, migration `20261110091000_safety_notification_outbox.sql` | retry/ticket-state Vitest coverage; Deno test source also included | Apply migration before deploying the Edge Function. Confirm Supabase Cron invokes the updated function. |
| P1-03 | **Mitigated per requested fallback; provider still absent** | `backend/supabase/functions/check-missed-checkin/emailNotifier.ts`, handler | adapter rejection test; handler logs contact ID only | Integrate a real email provider and configure its credentials before claiming emergency email delivery is live. |
| P1-04 | **Code fixed** | `backend/supabase/functions/location-alerts/index.ts`, `recipient.ts` | inviter, accepted partner, and stranger recipient tests | Deploy the updated Edge Function. |
| P1-05 | **Code fixed** | `frontend/src/app/api/ai/guardian/route.ts`, `frontend/src/lib/ai/untrusted-context.ts` | untrusted-block and closing-tag injection tests | None. |
| P1-06 | **Code fixed** | `frontend/src/lib/telegram.ts` | HTML metacharacter/script payload escaping tests | None. |
| P1-07 | **Signed-scope fallback implemented; Ops action required** | `frontend/src/lib/backblaze-b2.ts`, `api/media/b2-upload/route.ts`, new `api/media/b2-verify/route.ts`, `features/chat/FileUpload.tsx`, `.env.production.example` | upload authorization and verification route tests | Add `B2_UPLOAD_SIGNING_SECRET` to the appropriate Vercel environments. Restrict/rotate the Backblaze application key to bucket `little-world-media-vault`, filename prefix `couples/`, and minimum required capabilities. |
| P1-08 | **Code + migration ready; manual apply; access caveat** | `frontend/src/lib/google-drive.ts`, `api/drive/file/route.ts`, `google-drive-orphan-access.ts`, migration `20261110090000_preserve_drive_media_access_after_owner_deletion.sql` | accepted-member/orphan policy and file route tests; existing delete-route tests enforce read-only behavior | Apply migration before deploying code. Verify surviving partner Drive access to existing files; if the deleted owner's Drive connection was removed and the files were not shared/transferred, this code cannot recreate that Google authorization. |

## Migration and environment checklist

### SQL migrations — NOT APPLIED

1. `apps/web-platform/backend/supabase/migrations/20261110091000_safety_notification_outbox.sql`
   - Adds `safety_checkins.notification_status`, `notification_attempts`, and `last_notification_error`.
   - Creates the durable `safety_notification_outbox` table and an enqueue trigger.
2. `apps/web-platform/backend/supabase/migrations/20261110090000_preserve_drive_media_access_after_owner_deletion.sql`
   - Adds `owner_deleted_at` to `memories` and `messages`.
   - Adds a pre-delete trigger to retain an owner-deletion marker.

Apply both through the normal reviewed migration process, **not** by running them from this branch against Production. Back up and validate in a non-production environment first.

### Environment / Operations — NOT CHANGED

- `B2_UPLOAD_SIGNING_SECRET`: generate a high-entropy secret (at least 32 random bytes) and configure it in the relevant Vercel environments. Never put its value in Git.
- `CRON_SECRET` or `JOB_SECRET`: confirm it matches the Supabase Vault secret used by the corresponding Edge Function. This task did not synchronize either side.
- Backblaze: restrict and rotate the upload application key to the required bucket and `couples/` filename prefix. Until this is done, the temporary B2 upload authorization remains broader than the signed object name; a malicious client could attempt uploads elsewhere in the bucket before the token expires.
- Email: no Resend, Postmark, SendGrid, or Nodemailer integration was found in the inspected repository. The adapter throws `EmailProviderNotConfiguredError`; no email is sent until a provider is implemented and configured.
- Google Drive: ensure the surviving partner has actual Drive permission or a transferred copy of media formerly owned by the deleted account. Couple membership alone cannot restore a deleted Google OAuth connection or Google Drive file ownership.

## Verification

| Command | Result |
|---|---|
| `pnpm lint` | **Passed** — 0 errors; 26 existing warnings remain. |
| `pnpm typecheck` | **Passed**. |
| `pnpm test` | **Passed** — 51 test files, 181 tests. |
| `pnpm build` | **Passed** with dummy public Supabase build-time placeholders and a temporary local-only Next.js `experimental.cpus: 2` setting to avoid the sandbox's worker-thread limit. The original `next.config.js` was restored and is not part of the changes. |

The sandbox Node runtime was v25.9.0 while the frontend package declares Node `>=24.3.0 <25`; commands emitted an engine warning. The first build attempt hit the sandbox OS thread limit while Next.js attempted 47 workers; the bounded-worker build completed successfully. Deno CLI was not installed, so Deno-native test files were not executed; equivalent Vitest coverage for the pure retry, email-adapter, and recipient helpers was run and passed.

No Production secrets were printed, retrieved, or committed. Build placeholders were non-production dummy public values.

## Rollback procedure

Rollback means reverting the relevant code commit(s) and redeploying the prior application/Edge Function version. Do not roll back a migration by dropping columns/tables while the newer code is still deployed.

| P1-ID | Rollback |
|---|---|
| P1-01 | Revert the cron helper/routes commit and redeploy. Restore the previous caller/Edge Function header contract together; reverting only one side will reintroduce 401s. |
| P1-02 | Revert the Edge Function code only after disabling/reverting its new behavior. Keep the additive outbox migration in place during initial rollback; drop trigger/table/columns/type only after confirming no pending safety notifications and after a separate reviewed rollback migration. |
| P1-03 | Revert the email adapter call and deploy prior Edge Function. Do not remove provider credentials as part of rollback unless the provider integration was separately deployed. |
| P1-04 | Revert the recipient helper and Edge Function deployment. This restores the prior incorrect recipient behavior and is not recommended. |
| P1-05 | Revert the Guardian prompt/helper commit. This restores the vulnerable prompt construction and is not recommended. |
| P1-06 | Revert the Telegram escaping commit. This restores HTML injection exposure and is not recommended. |
| P1-07 | Revert client and both B2 API routes together. Keep the Backblaze key prefix restriction in place. Reverting code restores the previous unverified direct-upload flow and is not recommended. |
| P1-08 | Revert Drive access code only after deciding how orphaned files should be handled. Keep the additive migration initially; remove marker columns/trigger only via a reviewed rollback migration after checking dependent records. Reverting code restores partner-access loss. |

## Deployment risk

- P1-01: **Medium** — depends on matching existing Vercel and Vault configuration.
- P1-02: **High** — safety notification delivery depends on applying the migration and deploying the Edge Function together.
- P1-03: **High** — email notification remains unavailable until a provider is integrated.
- P1-04: **Low** — small recipient-selection correction.
- P1-05: **Medium** — changes prompt message composition and needs staged behavioral review.
- P1-06: **Low** — output escaping only.
- P1-07: **High** — direct-upload token scope must be restricted by Backblaze Operations.
- P1-08: **High** — migration and actual Google Drive sharing/ownership must be validated.

## Commit / branch notes

The branch has eight P1-focused remediation commits, plus one adjacent Telegram cleanup commit removing duplicate `setMyCommands` registration (needed to correct the existing webhook-registration test sequence). No PR was opened. The branch is intended for review before deployment.

