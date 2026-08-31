export type PerformanceMetric = {
  name: string
  value: number
  unit: 'ms' | 'count'
  timestamp: string
}

const metrics: PerformanceMetric[] = []

export function trackAppStartup(startTime: number) {
  const startupMs = Date.now() - startTime
  metrics.push({ name: 'app_startup', value: startupMs, unit: 'ms', timestamp: new Date().toISOString() })
}

export function trackScreenRender(screenName: string, renderMs: number) {
  metrics.push({ name: `screen_render:${screenName}`, value: renderMs, unit: 'ms', timestamp: new Date().toISOString() })
}

export function trackApiCall(label: string, durationMs: number) {
  metrics.push({ name: `api:${label}`, value: durationMs, unit: 'ms', timestamp: new Date().toISOString() })
}

export function getPerformanceMetrics() {
  return [...metrics]
}
