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

  it('predicts from a saved cycle length without guessing a fertile window', () => {
    const summary = calculateNativeCycleSummary([], {
      cycle_length: 28,
      period_length: 5,
      last_period_start: '2024-03-01',
    }, '2024-03-15')

    expect(summary.nextPeriodStart).toBe('2024-03-29')
    expect(summary.daysUntilPeriod).toBe(14)
    expect(summary.ovulationDate).toBeNull()
    expect(summary.fertileStart).toBeNull()
    expect(summary.fertileEnd).toBeNull()
    expect(summary.estimateReady).toBe(false)
    expect(summary.fertilityStatus).toBe('uncertain')
  })

  it('uses the observed 28-day cycle instead of the old manual setting', () => {
    const summary = calculateNativeCycleSummary(
      [
        { log_date: '2024-04-01', period_day: true },
        { log_date: '2024-03-04', period_day: true },
      ],
      { cycle_length: 30, period_length: 5, last_period_start: '2024-02-01' },
      '2024-04-15'
    )
    expect(summary.lastPeriodStart).toBe('2024-04-01')
    expect(summary.cycleLength).toBe(28)
    expect(summary.nextPeriodStart).toBe('2024-04-29')
    expect(summary.fertilityStatus).toBe('uncertain')
  })

  it('adapts gradually across normal 27-29 day variation', () => {
    const summary = calculateNativeCycleSummary(
      [
        { log_date: '2024-04-01', period_day: true },
        { log_date: '2024-03-03', period_day: true },
        { log_date: '2024-02-04', period_day: true },
        { log_date: '2024-01-07', period_day: true },
        { log_date: '2023-12-10', period_day: true },
        { log_date: '2023-11-13', period_day: true },
      ],
      { cycle_length: 28, period_length: 5, last_period_start: null },
      '2024-04-22'
    )
    expect(summary.variationMin).toBe(27)
    expect(summary.variationMax).toBe(29)
    expect(summary.cycleLength).toBe(28)
    expect(summary.nextPeriodStart).toBe('2024-04-29')
  })

  it('follows a repeated shift without overreacting to one isolated change', () => {
    const isolated = calculateNativeCycleSummary(
      [
        { log_date: '2024-04-01', period_day: true },
        { log_date: '2024-03-04', period_day: true },
        { log_date: '2024-02-05', period_day: true },
        { log_date: '2024-01-07', period_day: true },
        { log_date: '2023-12-10', period_day: true },
        { log_date: '2023-11-13', period_day: true },
      ],
      { cycle_length: 28, period_length: 5, last_period_start: null },
      '2024-04-22'
    )
    const repeated = calculateNativeCycleSummary(
      [
        { log_date: '2024-04-01', period_day: true },
        { log_date: '2024-03-03', period_day: true },
        { log_date: '2024-02-03', period_day: true },
        { log_date: '2024-01-05', period_day: true },
        { log_date: '2023-12-07', period_day: true },
        { log_date: '2023-11-09', period_day: true },
      ],
      { cycle_length: 28, period_length: 5, last_period_start: null },
      '2024-04-22'
    )
    expect(isolated.cycleLength).toBe(28)
    expect(repeated.cycleLength).toBe(29)
  })

  it('keeps the primary fertile estimate to seven days while exposing cycle variation', () => {
    const summary = calculateNativeCycleSummary(
      [
        { log_date: '2024-04-01', period_day: true },
        { log_date: '2024-03-01', period_day: true },
        { log_date: '2024-01-29', period_day: true },
      ],
      { cycle_length: 28, period_length: 5, last_period_start: null },
      '2024-04-22'
    )
    expect(summary.variationMin).toBe(31)
    expect(summary.variationMax).toBe(32)
    expect(summary.fertilityStatus).toBe('lower')
    expect(summary.cycleLength).toBe(32)
    expect(summary.nextPeriodStart).toBe('2024-05-03')
    expect(summary.ovulationDate).toBe('2024-04-19')
    expect(summary.fertileStart).toBe('2024-04-14')
    expect(summary.fertileEnd).toBe('2024-04-20')
  })

  it('uses a saved cycle length but withholds fertility estimates without history', () => {
    const summary = calculateNativeCycleSummary([], {
      cycle_length: 27,
      period_length: 5,
      last_period_start: '2024-09-14',
    }, '2024-09-20')

    expect(summary.nextPeriodStart).toBe('2024-10-11')
    expect(summary.ovulationDate).toBeNull()
    expect(summary.fertileStart).toBeNull()
    expect(summary.fertileEnd).toBeNull()
    expect(summary.fertilityStatus).toBe('uncertain')
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
