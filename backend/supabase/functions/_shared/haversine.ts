export function haversine(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
): number {
  const earthRadiusMeters = 6371000
  const phi1 = latitude1 * Math.PI / 180
  const phi2 = latitude2 * Math.PI / 180
  const deltaPhi = (latitude2 - latitude1) * Math.PI / 180
  const deltaLambda = (longitude2 - longitude1) * Math.PI / 180
  const a = Math.sin(deltaPhi / 2) ** 2
    + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
