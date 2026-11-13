export function hasValidMapCoordinates(latitude: unknown, longitude: unknown): boolean {
  return (
    typeof latitude === 'number' &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    typeof longitude === 'number' &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180
  )
}

export function isValidMapPoint(point: unknown): boolean {
  if (Array.isArray(point)) {
    return hasValidMapCoordinates(point[0], point[1])
  }

  if (point && typeof point === 'object') {
    const candidate = point as { lat?: unknown; lng?: unknown }
    return hasValidMapCoordinates(candidate.lat, candidate.lng)
  }

  return false
}
