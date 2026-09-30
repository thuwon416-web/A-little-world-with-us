const ANNIVERSARY = '2023-02-02'
const DAY_MS = 86_400_000

function dateInMyanmar(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Yangon',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function calculateDaysTogether(now = new Date(), startDate = ANNIVERSARY) {
  const today = new Date(`${dateInMyanmar(now)}T00:00:00Z`)
  const anniversary = new Date(`${startDate}T00:00:00Z`)
  return Math.max(0, Math.floor((today.getTime() - anniversary.getTime()) / DAY_MS))
}

export const relationshipAnniversary = ANNIVERSARY
