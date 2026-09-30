import { calculateDaysTogether } from './relationship-days'
import { describe, expect, it } from 'vitest'

describe('calculateDaysTogether', () => {
  it('calculates elapsed days from an anniversary', () => {
    expect(calculateDaysTogether(new Date('2023-02-03T12:00:00Z'), '2023-02-02')).toBe(1)
  })

  it('returns zero before the relationship starts', () => {
    expect(calculateDaysTogether(new Date('2023-02-01T12:00:00Z'), '2023-02-02')).toBe(0)
  })
})
