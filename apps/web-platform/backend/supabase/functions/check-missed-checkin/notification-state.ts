export function getNotificationRetryState(attempts: number, error: string) {
  const failed = attempts >= 5
  return {
    status: failed ? 'failed' as const : 'pending' as const,
    lastError: error.slice(0, 500),
  }
}

export function expoTicketsDelivered(payload: unknown, expectedCount: number): boolean {
  if (!payload || typeof payload !== 'object') return false
  const data = (payload as { data?: unknown }).data
  if (!Array.isArray(data) || data.length !== expectedCount) return false
  return data.every((ticket) => Boolean(ticket) && typeof ticket === 'object' && (ticket as { status?: unknown }).status === 'ok')
}
