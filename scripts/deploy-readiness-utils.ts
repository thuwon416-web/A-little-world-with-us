export function isSafeStagingUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname !== 'a-little-world-with-us.vercel.app'
  } catch {
    return false
  }
}

export function isScopedB2ObjectName(objectName: string | undefined, coupleId: string): boolean {
  return Boolean(objectName?.startsWith(`couples/${coupleId}/large-media/`))
}

export function isDriveOrphanAccessMatrixValid(memberStatus: number, strangerStatus: number): boolean {
  return memberStatus === 200 && strangerStatus === 404
}

export function isCronAuthMatrixValid(validStatus: number, missingStatus: number): boolean {
  return validStatus === 200 && missingStatus === 401
}
