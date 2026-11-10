export function orphanedDriveAccessPolicy(input: { ownerDeletedAt: string | null; isAcceptedCoupleMember: boolean }) {
  if (!input.ownerDeletedAt || !input.isAcceptedCoupleMember) return null
  return { canRead: true, canDelete: false, readOnlyOrphaned: true }
}
