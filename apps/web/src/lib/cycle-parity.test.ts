import { describe, expect, it } from 'vitest'
import {
  calculateCycleSummary,
  getFertilityLabel,
  getPeriodForecastLabel,
  type CareLog,
} from './care-data'
import {
  calculateNativeCycleSummary,
  getNativeFertilityLabel,
  getNativePeriodForecastLabel,
} from '../../../mobile/services/cycleCalculator'

type CycleVector = {
  name: string
  today: string
  dates: string[]
  cycleLengthSetting?: number
  manualLastStart?: string | null
  expected: {
    cycleLength: number
    nextPeriodStart: string | null
    daysUntilPeriod: number | null
    lateByDays: number
    fertilityStatus: 'higher' | 'lower' | 'uncertain'
    fertileStart: string | null
    fertileEnd: string | null
    periodLabel: string
    fertilityLabel: string
  }
}

const vectors: CycleVector[] = [
  {
    name: 'regular cycle history',
    today: '2025-03-15',
    dates: ['2025-03-01', '2025-01-31', '2025-01-03', '2024-12-06'],
    expected: {
      cycleLength: 28,
      nextPeriodStart: '2025-03-29',
      daysUntilPeriod: 14,
      lateByDays: 0,
      fertilityStatus: 'higher',
      fertileStart: '2025-03-10',
      fertileEnd: '2025-03-16',
      periodLabel: 'Period in 14 days',
      fertilityLabel: 'Higher estimated chance of pregnancy',
    },
  },
  {
    name: 'duplicate period dates are counted once',
    today: '2025-03-15',
    dates: ['2025-03-01', '2025-03-01', '2025-01-31', '2025-01-31', '2025-01-03'],
    expected: {
      cycleLength: 29,
      nextPeriodStart: '2025-03-30',
      daysUntilPeriod: 15,
      lateByDays: 0,
      fertilityStatus: 'higher',
      fertileStart: '2025-03-11',
      fertileEnd: '2025-03-17',
      periodLabel: 'Period in 15 days',
      fertilityLabel: 'Higher estimated chance of pregnancy',
    },
  },
  {
    name: 'shorter historical cycles',
    today: '2025-02-20',
    dates: ['2025-02-04', '2025-01-10', '2024-12-17'],
    expected: {
      cycleLength: 25,
      nextPeriodStart: '2025-03-01',
      daysUntilPeriod: 9,
      lateByDays: 0,
      fertilityStatus: 'lower',
      fertileStart: '2025-02-10',
      fertileEnd: '2025-02-16',
      periodLabel: 'Period in 9 days',
      fertilityLabel: 'Lower estimated chance of pregnancy',
    },
  },
  {
    name: 'longer historical cycles',
    today: '2025-02-15',
    dates: ['2025-01-31', '2025-01-02', '2024-12-04'],
    expected: {
      cycleLength: 29,
      nextPeriodStart: '2025-03-01',
      daysUntilPeriod: 14,
      lateByDays: 0,
      fertilityStatus: 'higher',
      fertileStart: '2025-02-10',
      fertileEnd: '2025-02-16',
      periodLabel: 'Period in 14 days',
      fertilityLabel: 'Higher estimated chance of pregnancy',
    },
  },
  {
    name: 'irregular cycles are uncertain',
    today: '2025-04-20',
    dates: ['2025-04-01', '2025-02-01', '2025-01-01', '2024-12-02'],
    expected: {
      cycleLength: 31,
      nextPeriodStart: '2025-05-02',
      daysUntilPeriod: 12,
      lateByDays: 0,
      fertilityStatus: 'uncertain',
      fertileStart: null,
      fertileEnd: null,
      periodLabel: 'Period in 12 days',
      fertilityLabel: 'Pregnancy chance estimate unavailable',
    },
  },
  {
    name: 'multiple recent cycles use the same median',
    today: '2025-04-15',
    dates: ['2025-04-01', '2025-03-04', '2025-02-05', '2025-01-07', '2024-12-10', '2024-11-12', '2024-10-15'],
    expected: {
      cycleLength: 28,
      nextPeriodStart: '2025-04-29',
      daysUntilPeriod: 14,
      lateByDays: 0,
      fertilityStatus: 'higher',
      fertileStart: '2025-04-10',
      fertileEnd: '2025-04-16',
      periodLabel: 'Period in 14 days',
      fertilityLabel: 'Higher estimated chance of pregnancy',
    },
  },
  {
    name: 'one period gives a cautious date estimate only',
    today: '2025-03-15',
    dates: ['2025-03-01'],
    cycleLengthSetting: 27,
    expected: {
      cycleLength: 27,
      nextPeriodStart: '2025-03-28',
      daysUntilPeriod: 13,
      lateByDays: 0,
      fertilityStatus: 'uncertain',
      fertileStart: null,
      fertileEnd: null,
      periodLabel: 'Period in 13 days',
      fertilityLabel: 'Pregnancy chance estimate unavailable',
    },
  },
  {
    name: 'no history has no predicted date',
    today: '2025-03-15',
    dates: [],
    expected: {
      cycleLength: 28,
      nextPeriodStart: null,
      daysUntilPeriod: null,
      lateByDays: 0,
      fertilityStatus: 'uncertain',
      fertileStart: null,
      fertileEnd: null,
      periodLabel: 'Log a period to begin forecasting.',
      fertilityLabel: 'Pregnancy chance estimate unavailable',
    },
  },
  {
    name: 'invalid or missing dates are ignored',
    today: '2025-03-15',
    dates: ['2025-02-30', '', '2025-01-10T00:00:00.000Z'],
    manualLastStart: '2025-02-30',
    expected: {
      cycleLength: 28,
      nextPeriodStart: null,
      daysUntilPeriod: null,
      lateByDays: 0,
      fertilityStatus: 'uncertain',
      fertileStart: null,
      fertileEnd: null,
      periodLabel: 'Log a period to begin forecasting.',
      fertilityLabel: 'Pregnancy chance estimate unavailable',
    },
  },
  {
    name: 'future period dates and settings are ignored',
    today: '2025-03-01',
    dates: ['2025-04-05'],
    manualLastStart: '2025-04-05',
    expected: {
      cycleLength: 28,
      nextPeriodStart: null,
      daysUntilPeriod: null,
      lateByDays: 0,
      fertilityStatus: 'uncertain',
      fertileStart: null,
      fertileEnd: null,
      periodLabel: 'Log a period to begin forecasting.',
      fertilityLabel: 'Pregnancy chance estimate unavailable',
    },
  },
  {
    name: 'date exactly on the forecast is not late',
    today: '2025-03-29',
    dates: ['2025-03-01', '2025-02-01', '2025-01-04'],
    expected: {
      cycleLength: 28,
      nextPeriodStart: '2025-03-29',
      daysUntilPeriod: 0,
      lateByDays: 0,
      fertilityStatus: 'uncertain',
      fertileStart: null,
      fertileEnd: null,
      periodLabel: 'Period expected today',
      fertilityLabel: 'Pregnancy chance estimate unavailable',
    },
  },
  {
    name: 'day before the forecast uses calendar-day difference',
    today: '2025-03-28',
    dates: ['2025-03-01', '2025-02-01', '2025-01-04'],
    expected: {
      cycleLength: 28,
      nextPeriodStart: '2025-03-29',
      daysUntilPeriod: 1,
      lateByDays: 0,
      fertilityStatus: 'lower',
      fertileStart: '2025-03-10',
      fertileEnd: '2025-03-16',
      periodLabel: 'Period in 1 day',
      fertilityLabel: 'Lower estimated chance of pregnancy',
    },
  },
  {
    name: 'past median forecast but within historical range is not late',
    today: '2025-03-30',
    dates: ['2025-03-01', '2025-02-01', '2025-01-02', '2024-12-06'],
    expected: {
      cycleLength: 28,
      nextPeriodStart: '2025-03-29',
      daysUntilPeriod: -1,
      lateByDays: 0,
      fertilityStatus: 'uncertain',
      fertileStart: null,
      fertileEnd: null,
      periodLabel: 'Period estimate passed',
      fertilityLabel: 'Pregnancy chance estimate unavailable',
    },
  },
  {
    name: 'beyond the full regular historical range is later than usual',
    today: '2025-03-30',
    dates: ['2025-03-01', '2025-02-01', '2025-01-04'],
    expected: {
      cycleLength: 28,
      nextPeriodStart: '2025-03-29',
      daysUntilPeriod: -1,
      lateByDays: 1,
      fertilityStatus: 'uncertain',
      fertileStart: null,
      fertileEnd: null,
      periodLabel: 'Period later than your usual range by 1 day',
      fertilityLabel: 'Pregnancy chance estimate unavailable',
    },
  },
  {
    name: 'DST boundary uses date-only arithmetic',
    today: '2024-03-11',
    dates: ['2024-03-10', '2024-02-11', '2024-01-14'],
    expected: {
      cycleLength: 28,
      nextPeriodStart: '2024-04-07',
      daysUntilPeriod: 27,
      lateByDays: 0,
      fertilityStatus: 'lower',
      fertileStart: '2024-03-19',
      fertileEnd: '2024-03-25',
      periodLabel: 'Period in 27 days',
      fertilityLabel: 'Lower estimated chance of pregnancy',
    },
  },
]

function createWebLog(logDate: string): CareLog {
  return {
    id: logDate,
    user_id: 'user',
    couple_id: 'couple',
    log_date: logDate,
    period_day: true,
    mood: null,
    symptoms: [],
    sex: [],
    discharge: [],
    digestion: [],
    pregnancy_test: [],
    ovulation_test: null,
    contraceptives: [],
    other_pills: [],
    medication_taken: null,
    water_intake: null,
    weight: null,
    basal_temp: null,
    notes: null,
    activities: [],
    other_tags: [],
    updated_at: '',
    updated_by: null,
  }
}

describe('Web and Mobile cycle forecast parity', () => {
  it.each(vectors)('$name', (vector) => {
    const webSummary = calculateCycleSummary(
      vector.dates.map(createWebLog),
      {
        couple_id: 'couple',
        cycle_length: vector.cycleLengthSetting ?? 28,
        period_length: 5,
        last_period_start: vector.manualLastStart ?? null,
        updated_at: '',
      },
      vector.today
    )
    const mobileSummary = calculateNativeCycleSummary(
      vector.dates.map((log_date) => ({ log_date, period_day: true })),
      {
        cycle_length: vector.cycleLengthSetting ?? 28,
        period_length: 5,
        last_period_start: vector.manualLastStart ?? null,
      },
      vector.today
    )
    const webResult = {
      cycleLength: webSummary.cycleLength,
      nextPeriodStart: webSummary.nextPeriodStart,
      daysUntilPeriod: webSummary.daysUntilPeriod,
      lateByDays: webSummary.lateByDays,
      fertilityStatus: webSummary.fertilityStatus,
      fertileStart: webSummary.fertileStart,
      fertileEnd: webSummary.fertileEnd,
      periodLabel: getPeriodForecastLabel(webSummary),
      fertilityLabel: getFertilityLabel(webSummary),
    }
    const mobileResult = {
      cycleLength: mobileSummary.cycleLength,
      nextPeriodStart: mobileSummary.nextPeriodStart,
      daysUntilPeriod: mobileSummary.daysUntilPeriod,
      lateByDays: mobileSummary.lateByDays,
      fertilityStatus: mobileSummary.fertilityStatus,
      fertileStart: mobileSummary.fertileStart,
      fertileEnd: mobileSummary.fertileEnd,
      periodLabel: getNativePeriodForecastLabel(mobileSummary),
      fertilityLabel: getNativeFertilityLabel(mobileSummary),
    }

    expect(webResult).toEqual(vector.expected)
    expect(mobileResult).toEqual(vector.expected)
    expect(mobileResult).toEqual(webResult)
  })
})
