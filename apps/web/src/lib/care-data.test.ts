import { describe, expect, it } from 'vitest'
import { calculateCycleSummary } from './care-data'

describe('cycle forecast', () => {
  it('predicts Oct 11 from the current logged cycle history', () => {
    const dates = ['2026-09-14','2026-08-17','2026-07-22','2026-06-25','2026-06-01','2026-05-02','2026-04-06']
    const logs = dates.map((log_date) => ({ id: log_date, user_id: 'u', couple_id: 'c', log_date, period_day: true, mood: null, symptoms: [], sex: [], discharge: [], digestion: [], pregnancy_test: [], ovulation_test: null, contraceptives: [], other_pills: [], medication_taken: null, water_intake: null, weight: null, basal_temp: null, notes: null, activities: [], other_tags: [], updated_at: '', updated_by: null }))
    const summary = calculateCycleSummary(logs, { couple_id: 'c', cycle_length: 28, period_length: 5, last_period_start: null, updated_at: '' })
    expect(summary.cycleLength).toBe(27)
    expect(summary.nextPeriodStart).toBe('2026-10-11')
    expect(summary.ovulationDate).toBe('2026-09-27')
    expect(summary.fertileStart).toBe('2026-09-22')
    expect(summary.fertileEnd).toBe('2026-09-28')
  })
})


describe('cycle forecast uncertainty', () => {
  it('marks a variable cycle as irregular instead of treating a passed estimate as definitively late', () => {
    const dates = ['2026-09-01', '2026-07-12', '2026-06-15']
    const logs = dates.map((log_date) => ({ id: log_date, user_id: 'u', couple_id: 'c', log_date, period_day: true, mood: null, symptoms: [], sex: [], discharge: [], digestion: [], pregnancy_test: [], ovulation_test: null, contraceptives: [], other_pills: [], medication_taken: null, water_intake: null, weight: null, basal_temp: null, notes: null, activities: [], other_tags: [], updated_at: '', updated_by: null }))
    const summary = calculateCycleSummary(logs, { couple_id: 'c', cycle_length: 28, period_length: 5, last_period_start: null, updated_at: '' })
    expect(summary.regular).toBe(false)
    expect(summary.nextPeriodStart).toBe('2026-10-10')
  })
})
