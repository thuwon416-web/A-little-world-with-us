import { supabase } from '@/lib/supabase'

export type CalendarEventType = 'date' | 'trip' | 'goal' | 'life' | 'other'
export type CalendarEvent = {
  id: string
  couple_id: string
  title: string
  event_date: string
  event_time: string | null
  description: string | null
  type: CalendarEventType
  repeat: string | null
  created_at: string
}
export type ListItem = {
  id: string
  couple_id: string
  item?: string
  title?: string
  completed: boolean
  created_at: string
}

async function context() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Please sign in again.')
  const { data, error } = await supabase
    .from('couple_links')
    .select('couple_id')
    .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
    .eq('status', 'accepted')
    .maybeSingle()
  if (error || !data?.couple_id)
    throw new Error('Accept a partner link before using the shared calendar.')
  return { user, coupleId: data.couple_id }
}

export async function getCalendarData(): Promise<{
  coupleId: string
  events: CalendarEvent[]
  bucket: ListItem[]
  wishlist: ListItem[]
}> {
  const { coupleId } = await context()
  const [
    { data: events, error: eventsError },
    { data: bucket, error: bucketError },
    { data: wishlist, error: wishlistError },
  ] = await Promise.all([
    supabase.from('events').select('*').eq('couple_id', coupleId).order('event_date'),
    supabase.from('bucket_list').select('*').eq('couple_id', coupleId).order('created_at'),
    supabase.from('wishlist').select('*').eq('couple_id', coupleId).order('created_at'),
  ])
  if (eventsError) throw eventsError
  if (bucketError) throw bucketError
  if (wishlistError) throw wishlistError
  return {
    coupleId,
    events: (events ?? []) as CalendarEvent[],
    bucket: (bucket ?? []) as ListItem[],
    wishlist: (wishlist ?? []) as ListItem[],
  }
}

export async function saveCalendarEvent(event: {
  id?: string
  coupleId: string
  title: string
  eventDate: string
  eventTime?: string
  description?: string
  type: CalendarEventType
  repeat?: string
}): Promise<void> {
  const { coupleId } = await context()
  if (event.coupleId !== coupleId)
    throw new Error('You can only update events for your accepted couple.')
  const payload = {
    couple_id: event.coupleId,
    title: event.title,
    event_date: event.eventDate,
    event_time: event.eventTime || null,
    description: event.description || null,
    type: event.type,
    repeat: event.repeat || null,
  }
  const request = event.id
    ? supabase.from('events').update(payload).eq('id', event.id)
    : supabase.from('events').insert(payload)
  const { error } = await request
  if (error) throw error
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  const { coupleId } = await context()
  const { error } = await supabase.from('events').delete().eq('id', id).eq('couple_id', coupleId)
  if (error) throw error
}
export async function saveListItem(
  coupleId: string,
  userId: string,
  kind: 'bucket' | 'wishlist',
  value: string
): Promise<void> {
  const active = await context()
  if (active.coupleId !== coupleId || active.user.id !== userId) {
    throw new Error('You can only update lists for your accepted couple.')
  }
  const { error } =
    kind === 'bucket'
      ? await supabase
          .from('bucket_list')
          .insert({ couple_id: coupleId, user_id: userId, item: value, completed: false })
      : await supabase
          .from('wishlist')
          .insert({ couple_id: coupleId, user_id: userId, title: value, completed: false })
  if (error) throw error
}
export async function toggleListItem(
  kind: 'bucket' | 'wishlist',
  id: string,
  completed: boolean
): Promise<void> {
  const { coupleId } = await context()
  const { error } = await supabase
    .from(kind === 'bucket' ? 'bucket_list' : 'wishlist')
    .update({ completed })
    .eq('id', id)
    .eq('couple_id', coupleId)
  if (error) throw error
}
export async function deleteListItem(kind: 'bucket' | 'wishlist', id: string): Promise<void> {
  const { coupleId } = await context()
  const { error } = await supabase
    .from(kind === 'bucket' ? 'bucket_list' : 'wishlist')
    .delete()
    .eq('id', id)
    .eq('couple_id', coupleId)
  if (error) throw error
}
export async function getSharedCalendarPreference(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_settings')
    .select('settings')
    .eq('user_id', userId)
    .maybeSingle()
  return (
    (data?.settings as { shared_calendar_enabled?: boolean } | null)?.shared_calendar_enabled ??
    true
  )
}
export async function saveSharedCalendarPreference(
  userId: string,
  enabled: boolean
): Promise<void> {
  const { data: existing } = await supabase
    .from('user_settings')
    .select('settings')
    .eq('user_id', userId)
    .maybeSingle()
  const { error } = await supabase.from('user_settings').upsert({
    user_id: userId,
    settings: { ...((existing?.settings ?? {}) as object), shared_calendar_enabled: enabled },
  })
  if (error) throw error
}
