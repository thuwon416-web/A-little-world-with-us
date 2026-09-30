import { calculateDaysTogether, relationshipAnniversary } from './relationshipDays'

describe('Native relationship days', () => {
  it('uses the configured anniversary and returns elapsed days', () => {
    expect(relationshipAnniversary).toBe('2023-02-02')
    expect(calculateDaysTogether(new Date('2023-02-03T12:00:00Z'), '2023-02-02')).toBe(1)
  })

  it('does not return a negative count', () => {
    expect(calculateDaysTogether(new Date('2023-02-01T12:00:00Z'), '2023-02-02')).toBe(0)
  })
})
