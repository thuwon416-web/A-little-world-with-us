# Release Evidence Pack

Updated: 2026-10-08

This file is the single evidence template for the final release sequence. It records facts only; an unchecked item must not be described as verified.

## Phase 10 — Owner verification

Repository-side Phase 8 hardening is complete; native/device checks below remain evidence gates because they require a current native build and runtime observation.

### Google Drive / Web
- [ ] Google Cloud OAuth client contains production callback:
  - `https://a-little-world-with-us.vercel.app/api/drive/callback`
- [ ] Sign in with a real Google account.
- [ ] Drive connect → Google consent → callback → Settings shows Connected.
- [ ] Drive disconnect removes the app connection and reconnects cleanly.

### Drive-backed Memories
- [ ] Upload one real image from Web.
- [ ] Confirm Supabase memory row contains `storage_provider=google_drive` and `drive_file_id`.
- [ ] Reload/re-render the memory successfully.
- [ ] Delete the memory/message and confirm the Drive object remains. Test explicit permanent Drive deletion separately.

### Web ↔ Mobile
- [ ] Auth
- [ ] Couple
- [ ] Chat
- [ ] Period
- [ ] Memories / Media
- [ ] Calendar / Plans / Finance
- [ ] Location / Safety
- [ ] Notifications / Offline recovery
- [ ] AI
- [ ] Drive

### Native
- [ ] Current-main Android build ID recorded.
- [ ] Current-main iOS build ID recorded.
- [ ] Native Drive PKCE/deep-link connect and disconnect.
- [ ] Camera/media permissions.
- [ ] Notifications/device registration.
- [ ] Background location/maps.
- [ ] WebRTC.
- [ ] Offline queue/retry/media recovery.

### Product QA
- [ ] Memories visual pass: cards, pin behavior, text contrast, loading/error states.
- [ ] Period/Fertility controlled scenario: recalculation after a delayed period and estimated chance wording.
- [ ] Korean Levels 4–6 human content QA.
- [ ] Accessibility checks.
- [ ] Dependabot/Security live snapshot.

## Phase 11 — Evidence-driven fixes

Only defects observed in Phase 10 belong here.

| Finding | Surface | Fix commit | Regression evidence | Recheck |
| --- | --- | --- | --- | --- |
| — | — | — | — | — |

## Phase 12 — Release Candidate freeze

Record all of the following from the same final revision:
- Final commit SHA:
- GitHub workflow/check evidence:
- Android build ID:
- iOS build ID:
- Vercel production deployment ID:
- Vercel deployment state:
- Production URL:
- Critical-path smoke result:
- Release decision:

## Phase 13 — Monitoring

For the first stability window, monitor:
- Drive OAuth/token refresh/upload/download/delete failures.
- Vercel runtime errors.
- Notification delivery and device registration.
- Background location/safety failures.
- Offline sync/retry/conflict failures.
- User-visible regressions.

Record incidents here only with observed evidence.

| Date | Surface | Evidence | Action | Status |
| --- | --- | --- | --- | --- |
| — | — | — | — | — |

## Phase 14 — Product evolution backlog

Do not start these as release blockers. Sequence after stability:
1. Korean grammar sequencing
2. Korean vocabulary sequencing
3. Korea Life
4. Couple Korean
5. Adaptive review
6. Speaking practice
7. Richer audio
8. AI Korean tutoring
9. Wellness enhancements

## Phase 15 — Long-term hardening

After release stability:
- Dependency/Dependabot remediation.
- Database index/FK optimization.
- Storage retention and cleanup.
- Observability dashboards and alert thresholds.
- Disaster recovery/export validation.
- Accessibility regression suite.

## Evidence rules

1. Code/config inspection is not a substitute for authenticated, device, or console evidence.
2. Historical native builds do not count as current-main evidence.
3. A missing provider credential is not a successful provider integration.
4. A READY deployment only proves that deployment is READY; it does not prove authenticated feature flows.
5. Keep this file synchronized with `docs/FINAL_VERIFICATION.md` and `docs/RELEASE_CLOSEOUT.md`.


### Drive-first archive additions
- [ ] Reconnect the Google OAuth grant with the broader Drive scope before testing external folder sync.
- [ ] Create `Kalaw 2026` under the app Drive root, add an image, run/trigger Drive sync, and confirm the image appears in Memories with `drive_file_id` and `drive_folder_id` metadata.
- [ ] Send a chat image and confirm it is stored in the Drive Chat year/month folder.
- [ ] Delete the chat message and confirm the Drive image remains.
- [ ] Confirm a daily chat archive file is created/updated under `Chat/{year}/{month}/` and is indexed by `chat_archive_days`.


### Latest Drive implementation build evidence
- A production Vercel build of commit `8c42ae5` reached the TypeScript stage but failed on four source errors in the new Drive archive implementation. Those errors were corrected afterward.
- The latest corrected `main` revision has not yet produced a successful Vercel build because the Hobby deployment API reached its daily deployment limit. Therefore current production deployment evidence must remain unchecked until a successful corrected build is observed.

- [ ] Delete a Drive-backed Memory from the app and confirm the original is moved to `Archive/Deleted Memories` and remains in Drive while the Memory disappears from the active app view.
- [ ] Reconnect/use the partner Drive connection and confirm retained shared media remains readable; do not delete shared media during account-erasure verification.
- [ ] Use the explicit permanent Drive-delete action on one test archive only and confirm the Drive object and archive index entry are removed.
