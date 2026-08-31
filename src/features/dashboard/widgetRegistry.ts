export type DashboardWidgetId =
  | 'days-counter'
  | 'countdown'
  | 'memory-of-the-day'
  | 'mini-care-check'
  | 'music-player'

export const DEFAULT_WIDGETS: DashboardWidgetId[] = [
  'days-counter',
  'countdown',
  'memory-of-the-day',
  'mini-care-check',
  'music-player',
]

export type DashboardLayout = {
  order: DashboardWidgetId[]
  visibility: Record<DashboardWidgetId, boolean>
}

const STORAGE_KEY = 'our-forever-dashboard-layout-v1'

export function loadDashboardLayout(): DashboardLayout | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    return JSON.parse(raw) as DashboardLayout
  } catch {
    return null
  }
}

export function saveDashboardLayout(layout: DashboardLayout) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
  } catch {
    // Ignore storage errors so the dashboard stays usable even in strict privacy mode.
  }
}
