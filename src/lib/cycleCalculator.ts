/**
 * Cycle Calculator - Phase 3A
 * Calculates cycle phases, fertile windows, and predictions
 */

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal'

export interface CycleData {
  startDate: Date
  cycleLength: number // Average cycle length in days (default: 28)
  periodLength?: number // Period length in days (default: 5)
}

export interface CyclePrediction {
  phase: CyclePhase
  dayInCycle: number
  fertileWindowStart?: Date
  fertileWindowEnd?: Date
  ovulationDate?: Date
  nextPeriodStart?: Date
  intimacyScore: number // 0-10 scale
  notes?: string
}

/**
 * Calculate current cycle phase and predictions
 */
export function calculateCycle(data: CycleData, referenceDate: Date = new Date()): CyclePrediction {
  const { startDate, cycleLength = 28, periodLength = 5 } = data

  // Calculate days since cycle start
  const daysSinceStart = Math.floor(
    (referenceDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Calculate day in current cycle (1-indexed)
  const dayInCycle = ((daysSinceStart % cycleLength) + cycleLength) % cycleLength + 1

  // Calculate ovulation day (typically day 14 of a 28-day cycle)
  const ovulationDay = Math.floor(cycleLength / 2)

  // Fertile window: 5 days before ovulation to 1 day after
  const fertileStartDay = ovulationDay - 5
  const fertileEndDay = ovulationDay + 1

  // Determine phase
  let phase: CyclePhase
  if (dayInCycle <= periodLength) {
    phase = 'menstrual'
  } else if (dayInCycle < fertileStartDay) {
    phase = 'follicular'
  } else if (dayInCycle <= fertileEndDay) {
    phase = 'ovulation'
  } else {
    phase = 'luteal'
  }

  // Calculate dates
  const ovulationDate = new Date(startDate)
  ovulationDate.setDate(ovulationDate.getDate() + ovulationDay)

  const fertileWindowStart = new Date(ovulationDate)
  fertileWindowStart.setDate(fertileWindowStart.getDate() - 5)

  const fertileWindowEnd = new Date(ovulationDate)
  fertileWindowEnd.setDate(fertileWindowEnd.getDate() + 1)

  const nextPeriodStart = new Date(startDate)
  nextPeriodStart.setDate(nextPeriodStart.getDate() + cycleLength)

  // Calculate intimacy score based on phase
  const intimacyScore = calculateIntimacyScore(phase, dayInCycle, cycleLength)

  return {
    phase,
    dayInCycle,
    fertileWindowStart,
    fertileWindowEnd,
    ovulationDate,
    nextPeriodStart,
    intimacyScore,
  }
}

/**
 * Calculate intimacy score (0-10) based on cycle phase
 */
function calculateIntimacyScore(phase: CyclePhase, dayInCycle: number, cycleLength: number): number {
  switch (phase) {
    case 'menstrual':
      return 3 // Lower during period
    case 'follicular':
      return 7 // Rising energy
    case 'ovulation':
      return 10 // Peak fertility and energy
    case 'luteal':
      // Decreasing as period approaches
      const daysToPeriod = cycleLength - dayInCycle
      return daysToPeriod < 7 ? 4 : 6
    default:
      return 5
  }
}

/**
 * Predict next 3 cycles
 */
export function predictCycles(data: CycleData, count: number = 3): Array<{
  startDate: Date
  endDate: Date
  ovulationDate: Date
  fertileWindow: { start: Date; end: Date }
}> {
  const predictions = []
  const currentStart = new Date(data.startDate)

  for (let i = 0; i < count; i++) {
    const cycleStart = new Date(currentStart)
    cycleStart.setDate(cycleStart.getDate() + (i * data.cycleLength))

    const cycleEnd = new Date(cycleStart)
    cycleEnd.setDate(cycleEnd.getDate() + data.cycleLength)

    const ovulationDate = new Date(cycleStart)
    ovulationDate.setDate(ovulationDate.getDate() + Math.floor(data.cycleLength / 2))

    const fertileStart = new Date(ovulationDate)
    fertileStart.setDate(fertileStart.getDate() - 5)

    const fertileEnd = new Date(ovulationDate)
    fertileEnd.setDate(fertileEnd.getDate() + 1)

    predictions.push({
      startDate: cycleStart,
      endDate: cycleEnd,
      ovulationDate,
      fertileWindow: { start: fertileStart, end: fertileEnd },
    })
  }

  return predictions
}

/**
 * Format phase for display (Myanmar + English)
 */
export function formatPhase(phase: CyclePhase): { en: string; mm: string } {
  const phases = {
    menstrual: { en: 'Menstrual', mm: 'နေ့စဉ်' },
    follicular: { en: 'Follicular', mm: 'မျိုးပွား' },
    ovulation: { en: 'Ovulation', mm: 'မျိုးပွားအမွှေး' },
    luteal: { en: 'Luteal', mm: 'နောက်ဆုံး' },
  }
  return phases[phase]
}
