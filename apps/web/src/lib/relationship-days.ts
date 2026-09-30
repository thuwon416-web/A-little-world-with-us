const DEFAULT_ANNIVERSARY = '2023-02-02'
const DAY_MS = 86_400_000

export function getRelationshipStartDate() {
  return process.env.NEXT_PUBLIC_ANNIVERSARY?.trim() || DEFAULT_ANNIVERSARY
}

function dateKeyInTimeZone(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

export function calculateDaysTogether(now = new Date(), startDate = getRelationshipStartDate()) {
  const today = dateKeyInTimeZone(now, 'Asia/Yangon')
  const start = new Date(`${startDate}T00:00:00Z`)
  const current = new Date(`${today}T00:00:00Z`)
  return Math.max(0, Math.floor((current.getTime() - start.getTime()) / DAY_MS))
}
