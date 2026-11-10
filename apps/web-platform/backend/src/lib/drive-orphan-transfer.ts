/**
 * Roadmap stub for P1-08 Option A.
 *
 * TODO: implement an idempotent account-deletion orchestration that copies
 * couple-owned files to the surviving member's Drive, verifies size/checksum,
 * records a transfer ledger, retries partial failures, updates app references
 * only after verification, and requires explicit user consent. Never delete
 * source files until every destination copy has been verified.
 *
 * This function is intentionally not wired into account deletion.
 */
export class NotImplementedError extends Error {
  constructor() {
    super('Drive orphan transfer is a documented roadmap item and is not implemented.')
    this.name = 'NotImplementedError'
  }
}

export async function transferOrphanedDriveMediaToPartner(_input: {
  coupleId: string
  survivingUserId: string
  sourceFileIds: string[]
}): Promise<never> {
  throw new NotImplementedError()
}
