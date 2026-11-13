import { describe, expect, it } from 'vitest'
import { hasValidMapCoordinates, isValidMapPoint } from './mapCoordinates'

describe('map coordinate guards', () => {
  it('accepts finite coordinates within latitude and longitude bounds', () => {
    expect(hasValidMapCoordinates(16.8661, 96.1951)).toBe(true)
    expect(isValidMapPoint([16.8661, 96.1951])).toBe(true)
    expect(isValidMapPoint({ lat: 16.8661, lng: 96.1951 })).toBe(true)
  })

  it('rejects NaN, infinite, missing, and non-numeric coordinates', () => {
    expect(hasValidMapCoordinates(Number.NaN, 96.1951)).toBe(false)
    expect(hasValidMapCoordinates(16.8661, Number.POSITIVE_INFINITY)).toBe(false)
    expect(isValidMapPoint([undefined, 96.1951])).toBe(false)
    expect(isValidMapPoint({ lat: '16.8661', lng: 96.1951 })).toBe(false)
    expect(isValidMapPoint(null)).toBe(false)
  })

  it('rejects coordinates outside geographic bounds', () => {
    expect(hasValidMapCoordinates(91, 96.1951)).toBe(false)
    expect(hasValidMapCoordinates(16.8661, 181)).toBe(false)
    expect(isValidMapPoint([16.8661, -181])).toBe(false)
  })
})
