# Final Verification Pack

Owner: Project maintainers
Status: PREPARED — manual verification is intentionally deferred until Phase 10 close-out.
Last Updated: 2026-10-08

## Rule

Do not run owner-side manual checks one-by-one while Phases 7–9 are still changing code. Collect all manual evidence once, after the final release revision is deployed and stable.

## Phase 10 single-pass checklist

### A. Google Drive / Web OAuth
- [ ] In Google Cloud OAuth client, confirm production redirect URI:
  `https://a-little-world-with-us.vercel.app/api/drive/callback`
- [ ] Confirm Vercel production environment has the required Drive OAuth values.
- [ ] Sign in to the production web app.
- [ ] Settings → Google Drive → Connect.
- [ ] Complete Google consent.
- [ ] Confirm callback returns to Settings with Connected state.
- [ ] Refresh the page and confirm Connected persists.
- [ ] Disconnect and confirm status becomes disconnected.
- [ ] Reconnect once to prove the lifecycle is repeatable.

### B. Drive-backed Memories
- [ ] With an accepted couple, upload a valid image from Memories.
- [ ] Confirm the Drive object is created.
- [ ] Confirm the Supabase memory row contains `storage_provider=google_drive` and a `drive_file_id`.
- [ ] Reload/re-enter Memories and confirm the image renders from the stored metadata.
- [ ] Open/download the memory through the app.
- [ ] Delete the memory/message and confirm the UI hides it while the Drive original remains; test permanent Drive deletion separately only when explicitly requested.
- [ ] Confirm an invalid image type/oversized upload is rejected without leaving an orphaned Drive object.

### C. Web ↔ Mobile smoke
Run once on the final release revision:
Auth → Couple → Chat → Period → Memories/Media → Calendar/Plans/Finance → Location/Safety → Notifications/Offline → AI → Drive.

Record any parity mismatch with:
- platform
- route/screen
- expected behavior
- observed behavior
- screenshot/log
- final commit

### D. Mobile native verification
- [ ] Build current `main` with EAS for Android.
- [ ] Build current `main` with EAS for iOS (device or simulator as appropriate).
- [ ] Confirm native Google Drive PKCE/deep-link connect and disconnect.
- [ ] Confirm SecureStore token lifecycle after reconnect/logout.
- [ ] Confirm camera/media permissions.
- [ ] Confirm push notification permission + receipt.
- [ ] Confirm background location permission and background update.
- [ ] Confirm maps/location sharing and offline queue recovery.
- [ ] Confirm WebRTC microphone/camera call path.
- [ ] Confirm offline chat/media recovery after reconnect.

Historical EAS artifacts do not count as current-main evidence.

### E. Memories / UI
- [ ] Visual pass for Memories card alignment, pin interaction, flashing/error states, text contrast, and the consolidated Memories layout.
- [ ] Confirm the intended order: Photo memories → Memory Map → Time capsule → Add to our memories → Our Story.
- [ ] Confirm AI Companion remains at the bottom.
- [ ] Check light/dark theme contrast and keyboard/small-screen behavior.

### F. Period / Fertility
Use a controlled test scenario, not an inferred real-user result:
- [ ] Enter the expected recent period dates.
- [ ] Confirm the cycle estimate recalibrates from actual cycle history rather than forcing a fixed 28-day rule.
- [ ] Delay the expected period and confirm the forecast updates.
- [ ] Confirm fertility wording is explicitly an estimate and not contraception/medical advice.
- [ ] Confirm late/irregular indicators only appear when supported by the accumulated dates.

### G. Korean Levels 4–6
- [ ] Human-review Web Level 4 lessons.
- [ ] Human-review Web Level 5 lessons.
- [ ] Human-review Web Level 6 lessons.
- [ ] Human-review matching Mobile lessons.
- [ ] Check Korean grammar, vocabulary, sequencing, examples, and exercise correctness.
- [ ] Record reviewer/date/result; structural lesson-count parity alone is not sufficient.

### H. Security / release gates
- [ ] Refresh GitHub Security/Dependabot alerts.
- [ ] Assess every currently open High/Critical alert.
- [ ] Confirm GitHub Actions checks for the final release revision.
- [ ] Confirm CodeQL/secret scanning status if enabled.
- [ ] Confirm no unexpected branch/PR/deployment is being treated as the release source.

### I. Optional storage paths
- [ ] If Backblaze B2 is enabled, test upload/download/authorization.
- [ ] If B2 is not enabled, record that it remains a non-release optional path.

## Evidence bundle to capture

Keep one final record containing:
1. final Git commit SHA
2. Vercel production deployment ID + READY state
3. Google Cloud OAuth callback screenshot/evidence
4. Drive connect/disconnect evidence
5. one uploaded memory's Supabase metadata evidence
6. Web↔Mobile smoke results
7. current-main Android/iOS EAS build IDs
8. native notification/location/WebRTC/offline results
9. Memories UI evidence
10. Period/Fertility scenario result
11. Korean 4–6 QA result
12. Dependabot/Security alert snapshot

## Post-Phase-10 follow-up phases

### Phase 11 — Evidence-driven fixes
Apply only defects found in the single verification pass. Re-test affected code paths and update the release ledger.

### Phase 12 — Release Candidate
Freeze the verified revision, re-run CI/build/deployment checks, confirm production deployment points to the frozen SHA, and perform a final smoke check.

### Phase 13 — Post-release monitoring
Watch runtime errors, Drive failures, notification/location failures, and user-visible regressions. Revisit deferred database/index work only after production stability is established.

### Phase 14 — Product evolution
Only after release stability: curriculum grammar/vocabulary sequencing, Korea Life/Couple Korean layers, adaptive review, speaking practice, richer audio, AI Korean tutoring, and wellness enhancements.


### Drive-first archive additions
- [ ] Reconnect the Google OAuth grant with the broader Drive scope before testing external folder sync.
- [ ] Create `Kalaw 2026` under the app Drive root, add an image, run/trigger Drive sync, and confirm the image appears in Memories with `drive_file_id` and `drive_folder_id` metadata.
- [ ] Send a chat image and confirm it is stored in the Drive Chat year/month folder.
- [ ] Delete the chat message and confirm the Drive image remains.
- [ ] Confirm a daily chat archive file is created/updated under `Chat/{year}/{month}/` and is indexed by `chat_archive_days`.

- [ ] Delete a Drive-backed Memory from the app and confirm the original is moved to `Archive/Deleted Memories` and remains in Drive while the Memory disappears from the active app view.
- [ ] Reconnect/use the partner Drive connection and confirm retained shared media remains readable; do not delete shared media during account-erasure verification.
- [ ] Use the explicit permanent Drive-delete action on one test archive only and confirm the Drive object and archive index entry are removed.
