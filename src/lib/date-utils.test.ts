import { addDays, endOfDay, isSameDay, startOfDay, toLocalDate } from './date-utils'
import { describe, expect, it } from 'vitest'

describe('date utilities', () => {
  it('formats dates and handles month and leap-year boundaries', () => {
    expect(toLocalDate(new Date(2024, 0, 31))).toBe('2024-01-31')
    expect(toLocalDate(addDays(new Date(2024, 0, 31), 1))).toBe('2024-02-01')
    expect(toLocalDate(addDays(new Date(2024, 1, 28), 1))).toBe('2024-02-29')
  })

  it('compares calendar days and normalizes day bounds', () => {
    const date = new Date(2024, 5, 15, 12, 30)
    expect(isSameDay(date, new Date(2024, 5, 15, 23, 59))).toBe(true)
    expect(isSameDay(date, new Date(2024, 5, 16))).toBe(false)
    expect(startOfDay(date).getHours()).toBe(0)
    expect(endOfDay(date).getHours()).toBe(23)
    expect(endOfDay(date).getMilliseconds()).toBe(999)
  })
})
