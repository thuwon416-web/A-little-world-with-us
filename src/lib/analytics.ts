declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>

type AnalyticsEvent = {
  name: string
  data?: AnalyticsPayload
}

const ANALYTICS_KEY = 'our-forever-analytics-events'

function readStoredEvents() {
  if (typeof window === 'undefined') return [] as AnalyticsEvent[]

  try {
    const raw = window.localStorage.getItem(ANALYTICS_KEY)
    return raw ? (JSON.parse(raw) as AnalyticsEvent[]) : []
  } catch {
    return [] as AnalyticsEvent[]
  }
}

function writeStoredEvents(events: AnalyticsEvent[]) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(ANALYTICS_KEY, JSON.stringify(events.slice(0, 50)))
  } catch {
    // Ignore storage failures in private browsing or blocked contexts.
  }
}

export function trackFeatureUsage(featureName: string, data?: AnalyticsPayload) {
  if (typeof window === 'undefined') return

  const event = { name: 'feature_usage', data: { featureName, ...data } }

  const nextEvents = [...readStoredEvents(), event]
  writeStoredEvents(nextEvents)

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'feature_usage', { feature_name: featureName, ...data })
  }
}

export function trackPageView(path = typeof window !== 'undefined' ? window.location.pathname : '/') {
  if (typeof window === 'undefined') return

  const event = { name: 'page_view', data: { path } }
  const nextEvents = [...readStoredEvents(), event]
  writeStoredEvents(nextEvents)

  if (typeof window.gtag === 'function') {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID ?? 'our-forever', {
      page_path: path,
    })
  }
}

export function getAnalyticsEvents() {
  return readStoredEvents()
}
