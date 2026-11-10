# P1 Commit Review

Review target: `fix/p1-security-remediation-20261110` compared with `main`.
Review method: inspected each of the eight P1 commit diffs and the resulting implementation/test files. This is a source review; it does not substitute for runtime validation of Supabase Edge Functions, B2 credentials, Telegram, or Google Drive OAuth.

## Commit inventory

| P1 | Commit | Subject |
|---|---|---|
| P1-01 | `f9e5289` | `fix(cron): unify x-job-secret header across cron wrappers` |
| P1-04 | `44dcbbf` | `fix(location): correct recipient selection for partner alerts` |
| P1-05 | `9cc8ae3` | `fix(ai): isolate untrusted context in Guardian prompt` |
| P1-08 | `b43249a` | `fix(drive): handle orphaned media after account deletion` |
| P1-06 | `e55e4ca` | `fix(telegram): escape HTML in dynamic message fields` |
| P1-07 | `c3391b0` | `fix(b2): bind upload authorization to signed object scope` |
| P1-03 | `bfec602` | `fix(safety): send emergency contact email via provider` |
| P1-02 | `8efda9d` | `fix(safety): add retry state machine to check-missed-checkin` |

## Rubric

| P1 | Fix solves stated finding | Tests assert correct behavior | No unrelated changes | No secret / PII leak | No silent error swallowing | Error paths handled | Type-safe; no new `any` | Migration idempotent |
|---|---|---|---|---|---|---|---|---|
| P1-01 | **Partial** | **Fail** | Pass | Pass | Pass | **Partial** | Pass | N/A |
| P1-02 | **Partial** | **Partial** | Pass | **Partial** | **Partial** | **Fail** | Pass | Pass |
| P1-03 | **Fail** | **Fail** | Pass | Pass | **Fail** | **Fail** | Pass | N/A |
| P1-04 | Pass | Pass* | Pass | Pass | Pass | Pass | Pass | N/A |
| P1-05 | **Partial** | **Fail** | Pass | Pass | Pass | **Partial** | Pass | N/A |
| P1-06 | **Fail** | **Fail** | Pass | Pass | Pass | **Partial** | Pass | N/A |
| P1-07 | **Partial** | **Partial** | **Partial** | Pass | Pass | **Partial** | Pass | N/A |
| P1-08 | **Partial** | **Partial** | Pass | Pass | Pass | **Partial** | Pass | Pass |

\* P1-04 has both Deno and Vitest tests for inviter/partner/non-member selection. The Deno test runner was not available in the prior validation environment; Vitest coverage exercises the pure helper.

## Detailed findings and required fixups

### P1-01 — Cron authentication header

The shared helper emits `x-job-secret`, and `callEdgeFunction()` attaches it. The missed-check-in wrapper no longer supplies the old `x-cron-secret`. However, the added route test checks the wrapper's incoming Bearer authorization, not the actual outbound `x-job-secret` header or all three wrapper routes. The commit also changes missing cron configuration from HTTP 500 to 401, which conflates server misconfiguration with caller authentication. Follow-up: test outbound headers and all wrappers; preserve a server-error status for missing server configuration while retaining 401 for invalid caller credentials.

### P1-02 — Missed-check-in retry/outbox

The migration uses idempotent enum creation, `ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`, index creation, and drop/recreate trigger logic. Pure retry and Expo-ticket helpers are tested. The handler, however, is not integration-tested; it performs multiple non-transactional updates to the check-in and outbox, and email failures are caught separately without entering the retry state machine. A failure after claiming/marking processing can leave inconsistent state until stale recovery. Follow-up: make delivery outcomes explicit, ensure email failure is retryable, and add handler-level tests around claim, failure, retry, and completion. Verify outbox/check-in state transitions are consistent.

### P1-03 — Emergency email

The adapter in this commit always throws `EmailProviderNotConfiguredError`; there is no Resend implementation or provider factory. The handler catches the exception, logs a warning, and proceeds, so the safety email remains undelivered and the error is effectively swallowed. Tests only assert that the placeholder throws. This commit does not solve the finding. Phase B must replace it with a real provider adapter, propagate failure into the notification retry state, and test provider success/failure and PII-safe logging.

### P1-04 — Location recipient

The pure recipient selector correctly chooses the accepted partner for an inviter-originated alert, the inviter for a partner-originated alert, and null for a non-member. The Edge Function uses the helper. No unrelated behavior or secret exposure was found. Keep the helper and tests; add an integration assertion if practical when strengthening Edge Function tests.

### P1-05 — Guardian prompt isolation

Retrieved context is moved out of the trusted system instruction string into a separate user message, with an explicit untrusted-data instruction. However, the formatter currently emits literal escaped `\\n` sequences rather than actual line breaks, and its closing-tag escaping is awkwardly double-escaped. The test asserts a string representation, not the model-facing security behavior. Follow-up: use unambiguous delimiters/encoding, test closing-tag payloads and exact formatting, and retain explicit instructions not to follow embedded directives. Prompt isolation reduces risk but cannot guarantee model behavior by itself.

### P1-06 — Telegram HTML escaping

`escapeTelegramHtml()` exists and several domain-specific fields use it. But `sendTelegramNotification()` interpolates `payload.details` without escaping; `sendTelegramMessage()` defaults to HTML parse mode, so this remains an injection path. The test covers the helper rather than a complete notification payload. Follow-up: escape all dynamic fields at the final HTML-rendering boundary, avoid double-escaping trusted markup by using a structured builder, and test title/details/actions through the actual notification formatter.

### P1-07 — B2 upload authorization

The server signs intended object metadata and the verification endpoint checks HMAC, path prefix, file ID, bucket, name, size, SHA-1, and expiry. The client calls verification before completing its upload flow. But the browser still receives a B2 upload URL and a bucket-level upload authorization token; the HMAC is not enforced by B2 itself. A leaked token can still be used for arbitrary bucket uploads until expiry, so this is a mitigation rather than a complete authorization-scope fix. The upload route also returns the raw target token by design. Tests do not establish that arbitrary bucket writes are impossible. Keep the manual prefix-restricted application-key action blocking; consider a server-side upload proxy as the complete fix. Review adjacent Drive/Telegram test edits as possible cross-commit coupling.

### P1-08 — Drive orphan access

The migration is rerunnable and marks owner deletion before the auth-user row is deleted. Access checks require accepted couple membership and return read-only metadata for orphaned records. However, no distinct orphan-access audit event is written. Resolving a surviving partner's OAuth connection does not grant that account permission to read a file that remains private in the deleted owner's Google Drive. The existing tests exercise a pure policy helper, not actual download authorization or byte non-disclosure. Option C must be documented as preserving only access to files already shared/accessible to the surviving member; otherwise return a safe 409 rather than implying that access was restored. Add audit logging and negative download tests.

## Overall Phase A decision

**Phase A review: FAIL pending fixups.** P1-03, P1-06, P1-08, and material portions of P1-01, P1-02, P1-05, and P1-07 do not yet meet the stated acceptance criteria. This report is committed before Phase B. Follow-up fixup commits are required; no production systems were accessed or changed during this review.
