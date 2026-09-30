export type Visibility = 'private' | 'shared' | 'partner_only'

export function isVisibleToPartner(visibility: Visibility | null | undefined, isLinked: boolean) {
  if (!isLinked) return false
  return visibility === 'shared' || visibility === 'partner_only'
}
