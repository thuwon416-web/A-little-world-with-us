import { calculateDaysTogether, relationshipAnniversary } from './relationshipDays'

describe('Native relationship days', () => {
  it('uses the environment-configured anniversary and returns elapsed days', () => {
    expect(relationshipAnniversary).toBe(process.env.EXPO_PUBLIC_COUPLE_START?.trim() || '2000-01-01')
    expect(calculateDaysTogether(new Date('2020-01-02T12:00:00Z'), '2020-01-01')).toBe(1)
  })

  it('does not return a negative count', () => {
    expect(calculateDaysTogether(new Date('2019-12-31T12:00:00Z'), '2020-01-01')).toBe(0)
  })
})
