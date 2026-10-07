# Testing

Owner: Engineering / QA
Update when: tests or acceptance criteria change
Last Updated: 2026-10-08

Test layers: Web lint/TypeScript/unit/accessibility/build; Mobile TypeScript/lint/Jest; GitHub Secret Scan/CodeQL; production smoke/E2E; Supabase-backed authenticated E2E; native/device/offline verification.

Accessibility evidence from the previous contrast and testing audits is retained. Re-run relevant checks after UI token/component changes, especially contrast, disabled/placeholder states, links, focus, and reduced motion.

Automated PASS is evidence for the tested revision only. Full authenticated cross-device flows, Drive E2E, native permissions, offline/media recovery, and real-user period/fertility scenarios remain release-boundary checks until exercised.