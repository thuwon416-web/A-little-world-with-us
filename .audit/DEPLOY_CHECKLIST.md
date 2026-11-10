# Staging and Production Deploy Checklist

## Pre-Deploy (Manual — Engineer)

- [ ] PR opened and reviewed by 2 engineers (after this branch is approved; no PR is opened by this task)
- [ ] Staging branch deployed
- [ ] `CRON_SECRET` matches the Supabase Vault cron secret (verify by hash, never by printing either value)
- [ ] `B2_UPLOAD_SIGNING_SECRET` generated with a cryptographically secure generator and set in staging Vercel
- [ ] `EMAIL_PROVIDER=resend` and `RESEND_API_KEY` set in the staging Supabase Edge Function environment; `EMERGENCY_EMAIL_FROM` is a verified sender
- [ ] Backblaze Application Key rotated and restricted to the required bucket and `couples/` name prefix, with only required capabilities
- [ ] Migration `20261110090000_preserve_drive_media_access_after_owner_deletion.sql` applied to staging
- [ ] Migration `20261110091000_safety_notification_outbox.sql` applied to staging
- [ ] Migration `20261110092000_safety_email_outbox.sql` applied to staging
- [ ] Migration `20261110093000_drive_media_access_audit.sql` applied to staging
- [ ] Emergency email test sent via `deno run --allow-env=EMAIL_PROVIDER,RESEND_API_KEY,EMERGENCY_EMAIL_FROM --allow-net=api.resend.com scripts/test-emergency-email.ts <test-address>` (do not run against a real emergency contact)
- [ ] Cron wrapper → Edge Function call returns 200 for all 3 wrappers; missing/invalid caller auth returns 401
- [ ] Guardian retrieved-memory injection test with a seeded malicious memory → no instructions executed and no private data disclosed
- [ ] Telegram HTML escape test with untrusted `<b>` / `<script>` payload → rendered as literal text
- [ ] B2 upload verification with tampered object name → 403 and no database media reference created
- [ ] Drive orphan access matrix verified: accepted member with pre-existing Drive permission can read; member cannot delete; stranger cannot read or delete; no accepted members means denied
- [ ] Review `.audit/decisions/P1-08-drive-orphan.md`; confirm Option C limitation is acceptable to product/legal stakeholders

## Deploy Day (Manual — Engineer)

- [ ] Production database backup taken and restore point verified
- [ ] Production migrations applied in filename order `20261110090000` → `20261110091000` → `20261110092000` → `20261110093000` (only after staging validation and approval)
- [ ] Deploy the reviewed branch to Production
- [ ] Verify production email provider readiness without exposing key values
- [ ] 24-hour log watch: cron 401 rate, safety push/email outbox retries and failures, B2 403 rate, Drive orphan audit events

## Rollback (Manual — Engineer)

- [ ] Follow the per-P1 rollback steps in `.audit/P1_REMEDIATION_REPORT.md`
- [ ] DB rollback SQL prepared and peer-reviewed for each migration; do not blindly drop outbox/audit data
- [ ] If email provider fails, disable emergency email sending only through a reviewed staging-first config change and keep outbox rows for retry; do not mark pending rows delivered
- [ ] If Drive orphan access behaves unexpectedly, disable the orphan read path while retaining audit records and references
- [ ] If B2 verification fails, stop new B2 uploads; do not bypass verification or expose upload credentials

## Staging Smoke Test

Run only against an isolated staging environment:

```bash
STAGING_BASE_URL=https://<staging-host> \
STAGING_CRON_SECRET=<staging-cron-secret> \
STAGING_USER_BEARER_TOKEN=<staging-user-token> \
STAGING_COUPLE_ID=<staging-couple-id> \
STAGING_MEMBER_BEARER_TOKEN=<staging-member-token> \
STAGING_STRANGER_BEARER_TOKEN=<staging-stranger-token> \
STAGING_ORPHAN_DRIVE_FILE_ID=<staging-orphan-file-id> \
pnpm exec tsx scripts/smoke-test-staging.ts
```

The script skips checks whose staging-only inputs are absent. It never prints token values. Do not set `STAGING_BASE_URL` to Production.
