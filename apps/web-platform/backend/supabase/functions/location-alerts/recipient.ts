export type AcceptedCoupleLink = { inviter_id: string; accepted_by: string | null }

export function getLocationAlertRecipient(link: AcceptedCoupleLink, senderId: string): string | null {
  if (link.inviter_id === senderId) return link.accepted_by
  if (link.accepted_by === senderId) return link.inviter_id
  return null
}
