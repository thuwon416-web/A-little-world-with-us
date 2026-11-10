import { describe, expect, it } from 'vitest'
import { NotImplementedError, transferOrphanedDriveMediaToPartner } from '../../../backend/src/lib/drive-orphan-transfer'

describe('Option A Drive orphan transfer roadmap stub', () => {
  it('is deliberately not implemented or wired into account deletion', async () => {
    await expect(transferOrphanedDriveMediaToPartner({ coupleId: 'couple-1', survivingUserId: 'partner-1', sourceFileIds: ['file-1'] }))
      .rejects.toBeInstanceOf(NotImplementedError)
  })
})
