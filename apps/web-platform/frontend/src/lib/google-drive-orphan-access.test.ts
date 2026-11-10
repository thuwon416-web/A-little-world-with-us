import { describe, expect, it } from 'vitest'
import { orphanedDriveAccessPolicy } from './google-drive-orphan-access'

describe('orphaned Drive media access policy', () => {
  it('allows an accepted partner to read but not delete orphaned media', () => {
    expect(orphanedDriveAccessPolicy({ ownerDeletedAt: '2026-01-01T00:00:00Z', isAcceptedCoupleMember: true }))
      .toEqual({ canRead: true, canDelete: false, readOnlyOrphaned: true })
  })
  it('denies strangers', () => {
    expect(orphanedDriveAccessPolicy({ ownerDeletedAt: '2026-01-01T00:00:00Z', isAcceptedCoupleMember: false })).toBeNull()
  })
  it('denies access when no accepted couple member exists', () => {
    expect(orphanedDriveAccessPolicy({ ownerDeletedAt: '2026-01-01T00:00:00Z', isAcceptedCoupleMember: false })).toBeNull()
  })

  it('does not treat records without an owner-deletion marker as orphaned', () => {
    expect(orphanedDriveAccessPolicy({ ownerDeletedAt: null, isAcceptedCoupleMember: true })).toBeNull()
  })
})
