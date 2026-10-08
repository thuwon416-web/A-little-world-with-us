# Testing

Owner: Engineering / QA
Update when: tests or acceptance criteria change
Last Updated: 2026-10-08

Test layers: Web lint/TypeScript/unit/accessibility/build; Mobile TypeScript/lint/Jest; GitHub Secret Scan/CodeQL; production smoke/E2E; Supabase-backed authenticated E2E; native/device/offline verification.

Automated PASS is evidence for the tested revision only. Full authenticated cross-device flows, Drive E2E, native permissions, offline/media recovery, and real-user period/fertility scenarios remain release-boundary checks until exercised.

## Verification Trigger Table

| Change trigger | Required evidence refresh |
| --- | --- |
| Korean 4–6 source/data changes | Current Vercel production/preview build log for the exact commit |
| Google Drive OAuth env or Google Cloud client changes | Exact redirect URI registration + authenticated connect/callback E2E |
| Storage provider code/env changes | Provider configuration inventory + upload/retrieve/delete evidence |
| Supabase bootstrap/migration changes | Live migration list + schema/RLS/advisor checks |
| UI token/component changes | Web/Mobile lint/typecheck/tests + relevant accessibility/device evidence |

Accessibility evidence from the previous contrast and testing audits is retained; re-run relevant checks after UI token/component changes, especially contrast, disabled/placeholder states, links, focus, and reduced motion.
