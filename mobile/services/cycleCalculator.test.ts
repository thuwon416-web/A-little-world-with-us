import { calculateNativeCycleSummary, periodStarts } from './cycleCalculator'

describe('Native cycle calculator', () => {
  it('groups consecutive period days into starts', () => {
    expect(
      periodStarts([
        { log_date: '2024-03-01', period_day: true },
        { log_date: '2024-03-02', period_day: true },
        { log_date: '2024-02-01', period_day: true },
      ])
    ).toEqual(['2024-03-01', '2024-02-01'])
  })

  it('predicts the next period and fertile window', () => {
    const summary = calculateNativeCycleSummary([], {
      cycle_length: 28,
      period_length: 5,
      last_period_start: '2024-03-01',
    })

    expect(summary.nextPeriodStart).toBe('2024-03-29')
    expect(summary.ovulationDate).toBe('2024-03-15')
    expect(summary.fertileStart).toBe('2024-03-10')
    expect(summary.fertileEnd).toBe('2024-03-16')
    expect(summary.estimateReady).toBe(true)
  })

  it('returns an unready summary without period data', () => {
    const summary = calculateNativeCycleSummary([], {
      cycle_length: 28,
      period_length: 5,
      last_period_start: null,
    })

    expect(summary.lastPeriodStart).toBeNull()
    expect(summary.nextPeriodStart).toBeNull()
    expect(summary.estimateReady).toBe(false)
  })
})
