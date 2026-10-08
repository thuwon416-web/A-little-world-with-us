# Current State

Owner: Project maintainers
Update when: release gates or verification evidence change
Last Updated: 2026-10-08

## 1. Current Release
Release-readiness hardening on main.

## 2. Current Phase
Phase 6 — Final Production Audit + User Verification.

## 3. Overall Status
PENDING RELEASE VERIFICATION.

## 4. COMPLETED
Web/Mobile foundations; Korean Levels 4–6 implementation foundation; AI feature-provider profiles; Google Drive Web OAuth state hardening; Supabase-backed memory metadata; prior CI/security hardening; canonical documentation migration.

## 5. VERIFIED
- Live Supabase migration history was checked directly on 2026-10-08. Live head is `20261007121841 — restore_rls_helper_execute`.
- Bootstrap numbering intent was reconciled on 2026-10-08. The repository's 33/51/52 prefixes represent distinct SQL changes; duplicate prefixes are not evidence of a collision by themselves.
- Storage precedence/configuration was reconciled on 2026-10-08. Web shared-memory upload is Drive-first when the authenticated Drive connection is active; otherwise the media API uses Cloudinary; if Cloudinary is unavailable the page falls back to encrypted Supabase Storage. Live Vercel environment configuration contains the required Drive, Cloudinary, and B2 variable entries for production/preview/development. Current live `memories` table has zero rows, so no provider-usage distribution can be claimed.
- Current repository head is `1c3f78fa8fe34c518cb21b5834fbafa055892b82`. A production deployment was started from that exact commit on 2026-10-08 as `dpl_6CnQ1obMNiPZ2oweVqethGQix2bi`; build verification is still in progress.

## 6. VERIFY / BLOCKED-BY-EVIDENCE
1. **Korean 4–6 runtime CI/build verification — VERIFY.** The latest earlier Vercel build for commit `74882b37e931c3d5b2879f0f9cf3b03fd4568584` failed at `apps/web/src/data/korean-advanced.ts:19` with `Expression expected`. The current main revision contains the syntax correction (the duplicate closing bracket is gone), but the fresh production deployment from current main is still BUILDING, so a successful current build is not yet evidenced.
2. **Exact Google Cloud production Drive callback registration — VERIFY.** Vercel production contains the required Drive OAuth environment entries, but the Google Cloud OAuth client configuration is outside the available live tools. The exact authorized redirect URI therefore cannot be independently proven yet. Required URI: `https://a-little-world-with-us.vercel.app/api/drive/callback`.

## 7. PENDING
Production Drive E2E, authenticated Supabase E2E, native/device/store gates, Web↔Mobile parity, real-device offline/media recovery, Memories/media retrieval, period/fertility scenarios, Korean content QA, and remaining release acceptance.

## 8. BLOCKED
- Korean 4–6: current production deployment build is still in progress; prior failed build evidence is superseded only after the new deployment reaches READY.
- Google Drive callback registration: Google Cloud Console state is not exposed through the available tools.

## 9. DEFERRED
Supabase index/FK optimization; platform-tier leaked-password protection; breaking framework/toolchain upgrades.

## 10. REMAINING RELEASE GATES
Web release → authenticated E2E → Drive E2E → Web/Mobile parity → device/offline verification → manual acceptance.

## 11. VERIFICATION TRIGGER TABLE
| Trigger | Ownering evidence | Current action |
| --- | --- | --- |
| Repository/live DB migration history changes | Supabase migration list + `docs/DATABASE.md` | Re-check live head |
| Bootstrap SQL numbering/content changes | GitHub bootstrap files + live migration names | Reconcile intent; do not infer ordering from filename alone |
| Storage provider/configuration changes | GitHub upload/retrieval code + Vercel env inventory + live metadata | Reconcile precedence and actual provider use |
| Google Drive OAuth configuration changes | Vercel env inventory + Google Cloud OAuth client | Re-check exact callback registration and E2E |
| Korean 4–6 code/build changes | Exact commit + Vercel build logs | Require a current successful build before VERIFIED |

## 12. LAST VERIFIED
2026-10-08 — live Supabase migration head, bootstrap numbering intent, storage precedence/configuration, and current production deployment target were re-audited.

## 13. NEXT ACTION
Finish the current production deployment build verification, then perform Google Drive OAuth callback/E2E verification and the remaining authenticated/device release gates.
