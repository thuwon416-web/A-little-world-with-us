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

const STORAGE_KEY = 'a-little-world-with-us-dashboard-layout-v1'

function isDashboardLayout(value: unknown): value is DashboardLayout {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<DashboardLayout>
  return Array.isArray(candidate.order) && !!candidate.visibility && typeof candidate.visibility === 'object'
}

function loadLocalDashboardLayout(): DashboardLayout | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as unknown
    return isDashboardLayout(parsed) ? parsed : null
  } catch {
    return null
  }
}

function saveLocalDashboardLayout(layout: DashboardLayout) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
  } catch {
    // Ignore storage errors so the dashboard stays usable even in strict privacy mode.
  }
}

export async function loadDashboardLayout(): Promise<DashboardLayout | null> {
  const local = loadLocalDashboardLayout()
  try {
    const { supabase } = await import('@/lib/supabase')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return local
    const { data } = await supabase.from('user_settings').select('settings').eq('user_id', user.id).maybeSingle()
    const remote = (data?.settings as { dashboard_layout?: unknown } | null)?.dashboard_layout
    if (isDashboardLayout(remote)) {
      saveLocalDashboardLayout(remote)
      return remote
    }
  } catch {
    // Local preferences keep the dashboard usable when offline.
  }
  return local
}

export async function saveDashboardLayout(layout: DashboardLayout): Promise<void> {
  saveLocalDashboardLayout(layout)
  try {
    const { supabase } = await import('@/lib/supabase')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: current } = await supabase.from('user_settings').select('settings').eq('user_id', user.id).maybeSingle()
    const settings = { ...((current?.settings as Record<string, unknown> | null) ?? {}), dashboard_layout: layout }
    await supabase.from('user_settings').upsert({ user_id: user.id, settings }, { onConflict: 'user_id' })
  } catch {
    // The local copy is retained and sync will be retried on the next edit.
  }
}
