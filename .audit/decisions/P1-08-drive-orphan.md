# Decision: P1-08 Google Drive media after owner deletion

**Decision: Option C — retain orphaned couple media as read-only, with explicit limitations.**

| Option | Description | Pros | Cons | Risk |
|---|---|---|---|---|
| A | Transfer media to the surviving partner's Drive OAuth connection during account deletion | Full retention in a live account; partner can manage their own copy | Requires delete-time orchestration, Drive API permissions, quota handling, partial-failure recovery, and careful ownership/audit semantics | Medium |
| B | Migrate couple media to Backblaze B2 during account deletion | Vendor-independent retention; app controls future access | Requires bulk transfer, checksum verification, storage billing, retry/rollback design, and a large data migration | High |
| C | Keep media references read-only after owner deletion; never delete the orphan through the app | Smallest change; avoids transferring ownership or granting new Google Drive permissions | Does not restore access to a file that remains private in the deleted owner's Drive; access only works if the surviving member already has Drive permission or the file is otherwise accessible through an existing connection | Low |

## Rationale

Option C is selected because account deletion must not silently transfer private Drive content or broaden access to a surviving partner. It preserves the couple-owned database reference and records the owner-deletion timestamp, requires an accepted member of that couple for app-mediated access, denies deletion of orphaned media, and emits a distinct audit event for read and delete attempts.

**Important limitation:** Option C does not manufacture Google Drive permission. If the deleted owner's Drive file was private to that owner and the surviving partner has no pre-existing permission, the app cannot return its bytes. In that case the file endpoint must fail closed (no bytes; a Drive access error) rather than claim that partner access has been restored. A partner can read an orphan only where their existing Google Drive connection is already authorized to read the file.

## Roadmap: Option A

Implement a separate, explicitly consented transfer workflow before account deletion:

1. Enumerate couple-owned Drive files and validate the surviving member's active Drive OAuth connection.
2. Copy each file into a couple folder owned by the surviving member; preserve MIME type and metadata where supported.
3. Verify each copy by size and checksum, and record source/destination IDs in an idempotent transfer ledger.
4. Retry transient failures and expose a resumable partial-transfer state; do not delete the original while any copy is unverified.
5. Update application references only after verified copies are available; audit every transfer and require explicit user-facing disclosure/consent.
6. Retain a rollback window and operational runbook for quota, revoked OAuth, and permission failures.

A non-wired stub is provided at `apps/web-platform/backend/src/lib/drive-orphan-transfer.ts` as the implementation landing pad. No transfer is run during account deletion in this release.
