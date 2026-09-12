import { calculateLoveScore } from './love-score'

describe('calculateLoveScore', () => {
  it('is deterministic and bounded', () => {
    const score = calculateLoveScore('Alex', 'Sam')
    expect(calculateLoveScore('Alex', 'Sam')).toBe(score)
    expect(score).toBeGreaterThanOrEqual(1)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('normalizes names and handles empty input', () => {
    expect(calculateLoveScore(' A-lex ', 'Sam')).toBe(calculateLoveScore('Alex', 'Sam'))
    expect(calculateLoveScore('', '   ')).toBe(0)
  })
})
