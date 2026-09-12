export type NativeCareLog = {
  log_date: string
  period_day: boolean
  mood?: string | null
  symptoms?: string[] | null
}

export type NativeCycleSettings = {
  cycle_length: number
  period_length: number
  last_period_start: string | null
}

export type NativeCycleSummary = {
  cycleLength: number
  periodLength: number
  lastPeriodStart: string | null
  nextPeriodStart: string | null
  fertileStart: string | null
  fertileEnd: string | null
  ovulationDate: string | null
  day: number | null
  regular: boolean
  estimateReady: boolean
  variationMin: number
  variationMax: number
  cycleHistory: {
    startDate: string
    endDate: string
    length: number
    status: 'actual' | 'predicted'
  }[]
}

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day, 12)
}

export function dateKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}

export function addDays(value: string, amount: number) {
  const date = parseDate(value)
  date.setDate(date.getDate() + amount)
  return dateKey(date)
}

function daysBetween(start: string, end: string) {
  return Math.round((parseDate(end).getTime() - parseDate(start).getTime()) / 86400000)
}

export function periodStarts(logs: NativeCareLog[]) {
  const days = logs
    .filter((log) => log.period_day)
    .map((log) => log.log_date)
    .sort()
  return days.filter((day, index) => index === 0 || daysBetween(days[index - 1], day) > 1).reverse()
}

export function calculateNativeCycleSummary(
  logs: NativeCareLog[],
  settings: NativeCycleSettings
): NativeCycleSummary {
  const starts = periodStarts(logs)
  const historicalLengths = starts.slice(0, 6).flatMap((start, index) => {
    const older = starts[index + 1]
    const length = older ? daysBetween(older, start) : 0
    return length >= 15 && length <= 60 ? [length] : []
  })
  const ordered = [...historicalLengths].sort((a, b) => a - b)
  const middle = Math.floor(ordered.length / 2)
  const cycleLength = ordered.length
    ? Math.floor(ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2)
    : settings.cycle_length
  const lastPeriodStart = settings.last_period_start ?? starts[0] ?? null
  const variationMin = historicalLengths.length ? Math.min(...historicalLengths) : cycleLength
  const variationMax = historicalLengths.length ? Math.max(...historicalLengths) : cycleLength
  const actualHistory = starts
    .slice(0, 6)
    .flatMap((start, index) => {
      const older = starts[index + 1]
      const length = older ? daysBetween(older, start) : 0
      return older && length >= 15 && length <= 60
        ? [{ startDate: older, endDate: addDays(start, -1), length, status: 'actual' as const }]
        : []
    })
    .reverse()
  if (!lastPeriodStart) {
    return {
      cycleLength,
      periodLength: settings.period_length,
      lastPeriodStart: null,
      nextPeriodStart: null,
      fertileStart: null,
      fertileEnd: null,
      ovulationDate: null,
      day: null,
      regular: variationMax - variationMin <= 7,
      estimateReady: false,
      variationMin,
      variationMax,
      cycleHistory: actualHistory,
    }
  }
  const nextPeriodStart = addDays(lastPeriodStart, cycleLength)
  const ovulationDate = addDays(nextPeriodStart, -14)
  const today = dateKey(new Date())
  return {
    cycleLength,
    periodLength: settings.period_length,
    lastPeriodStart,
    nextPeriodStart,
    fertileStart: addDays(ovulationDate, -5),
    fertileEnd: addDays(ovulationDate, 1),
    ovulationDate,
    day: Math.max(1, daysBetween(lastPeriodStart, today) + 1),
    regular: variationMax - variationMin <= 7,
    estimateReady: starts.length >= 2 || settings.last_period_start !== null,
    variationMin,
    variationMax,
    cycleHistory: [
      ...actualHistory,
      {
        startDate: lastPeriodStart,
        endDate: addDays(nextPeriodStart, -1),
        length: cycleLength,
        status: 'predicted',
      },
    ],
  }
}
