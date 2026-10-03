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
  daysUntilPeriod: number | null
  lateByDays: number
  fertileStart: string | null
  fertileEnd: string | null
  ovulationDate: string | null
  day: number | null
  regular: boolean
  estimateReady: boolean
  fertilityStatus: 'higher' | 'lower' | 'uncertain'
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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) return null
  const date = new Date(0)
  date.setUTCHours(0, 0, 0, 0)
  date.setUTCFullYear(year, month - 1, day)
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  return date
}

export function dateKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}

export function addDays(value: string, amount: number) {
  const date = parseDate(value)
  if (!date || !Number.isInteger(amount)) throw new RangeError('A valid date and whole number of days are required.')
  const result = new Date(date.getTime() + amount * 86400000)
  return `${String(result.getUTCFullYear()).padStart(4, '0')}-${String(result.getUTCMonth() + 1).padStart(2, '0')}-${String(result.getUTCDate()).padStart(2, '0')}`
}

function daysBetween(start: string, end: string) {
  const startDate = parseDate(start)
  const endDate = parseDate(end)
  if (!startDate || !endDate) throw new RangeError('Valid date-only values are required.')
  return Math.round((endDate.getTime() - startDate.getTime()) / 86400000)
}

function validPastDate(value: string | null, today: string) {
  return value && parseDate(value) && value <= today ? value : null
}

function validCycleLength(value: number) {
  return Number.isInteger(value) && value >= 15 && value <= 60 ? value : 28
}

export function periodStarts(logs: NativeCareLog[], today = dateKey(new Date())) {
  const days = [...new Set(logs
    .filter((log) => log.period_day)
    .map((log) => log.log_date)
    .filter((day) => validPastDate(day, today)))]
    .sort((a, b) => a.localeCompare(b))
  return days.filter((day, index) => index === 0 || daysBetween(days[index - 1], day) > 1).reverse()
}

export function buildNativeCycleHistory(
  logs: NativeCareLog[],
  summary: NativeCycleSummary
): NativeCycleSummary['cycleHistory'] {
  const starts = [...periodStarts(logs)].reverse()
  return starts.map((startDate, index) => {
    const nextStart = starts[index + 1] ?? (startDate === summary.lastPeriodStart ? summary.nextPeriodStart : null)
    const endDate = nextStart ? addDays(nextStart, -1) : startDate
    const length = nextStart ? daysBetween(startDate, nextStart) : summary.cycleLength
    return {
      startDate,
      endDate,
      length,
      status: nextStart && startDate !== summary.lastPeriodStart ? 'actual' as const : 'predicted' as const,
    }
  }).filter((cycle) => cycle.startDate >= '2024-01-01' && cycle.length > 0)
}

export function calculateNativeCycleSummary(
  logs: NativeCareLog[],
  settings: NativeCycleSettings,
  today = dateKey(new Date())
): NativeCycleSummary {
  const starts = periodStarts(logs, today)
  const historicalLengths = starts.slice(0, 6).flatMap((start, index) => {
    const older = starts[index + 1]
    const length = older ? daysBetween(older, start) : 0
    return length >= 15 && length <= 60 ? [length] : []
  })
  const ordered = [...historicalLengths].sort((a, b) => a - b)
  const middle = Math.floor(ordered.length / 2)
  const median = ordered.length
    ? (ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2)
    : validCycleLength(settings.cycle_length)
  const cycleLength = Math.round(median)
  // Logged period history is the source of truth; the saved setting is only a fallback.
  const lastPeriodStart = starts[0] ?? validPastDate(settings.last_period_start, today)
  const variationMin = historicalLengths.length ? Math.min(...historicalLengths) : cycleLength
  const variationMax = historicalLengths.length ? Math.max(...historicalLengths) : cycleLength
  const regular = variationMax - variationMin <= 7
  const estimateReady = historicalLengths.length >= 2 && regular
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
      daysUntilPeriod: null,
      lateByDays: 0,
      fertileStart: null,
      fertileEnd: null,
      ovulationDate: null,
      day: null,
      regular,
      estimateReady: false,
      fertilityStatus: 'uncertain',
      variationMin,
      variationMax,
      cycleHistory: actualHistory,
    }
  }

  const nextPeriodStart = addDays(lastPeriodStart, cycleLength)
  const daysUntilPeriod = daysBetween(today, nextPeriodStart)
  const cycleDay = daysBetween(lastPeriodStart, today)
  const lateByDays = estimateReady && cycleDay > variationMax ? cycleDay - variationMax : 0
  const hasCurrentFertilityEstimate = estimateReady && today < nextPeriodStart
  const ovulationDate = hasCurrentFertilityEstimate ? addDays(nextPeriodStart, -14) : null
  const fertileStart = ovulationDate ? addDays(ovulationDate, -5) : null
  const fertileEnd = ovulationDate ? addDays(ovulationDate, 1) : null
  const fertilityStatus: 'higher' | 'lower' | 'uncertain' = !hasCurrentFertilityEstimate
    ? 'uncertain'
    : today >= fertileStart! && today <= fertileEnd!
      ? 'higher'
      : 'lower'
  return {
    cycleLength,
    periodLength: settings.period_length,
    lastPeriodStart,
    nextPeriodStart,
    daysUntilPeriod,
    lateByDays,
    fertileStart,
    fertileEnd,
    ovulationDate,
    day: Math.max(1, cycleDay + 1),
    regular,
    estimateReady,
    fertilityStatus,
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

export function getNativePeriodForecastLabel(summary: NativeCycleSummary) {
  if (summary.daysUntilPeriod === null) return 'Log a period to begin forecasting.'
  if (summary.daysUntilPeriod > 0) return `Period in ${summary.daysUntilPeriod} day${summary.daysUntilPeriod === 1 ? '' : 's'}`
  if (summary.daysUntilPeriod === 0) return 'Period expected today'
  if (summary.lateByDays > 0) return `Period later than your usual range by ${summary.lateByDays} day${summary.lateByDays === 1 ? '' : 's'}`
  return 'Period estimate passed'
}

export function getNativeFertilityLabel(summary: NativeCycleSummary) {
  if (summary.fertilityStatus === 'higher') return 'Higher estimated chance of pregnancy'
  if (summary.fertilityStatus === 'lower') return 'Lower estimated chance of pregnancy'
  return 'Pregnancy chance estimate unavailable'
}
