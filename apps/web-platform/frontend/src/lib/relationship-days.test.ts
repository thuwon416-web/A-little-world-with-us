import { calculateDaysTogether } from './relationship-days'
import { describe, expect, it } from 'vitest'

describe('calculateDaysTogether', () => {
  it('calculates elapsed days from an anniversary', () => {
    expect(calculateDaysTogether(new Date('2020-01-02T12:00:00Z'), '2020-01-01')).toBe(1)
  })

  it('returns zero before the relationship starts', () => {
    expect(calculateDaysTogether(new Date('2019-12-31T12:00:00Z'), '2020-01-01')).toBe(0)
  })
})
