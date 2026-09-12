import { supabase } from '@/lib/supabase'
import type { CalendarEvent } from '@/shared-types'

export const calendarService = {
  async getByCouple(coupleId: string): Promise<CalendarEvent[]> {
    const { data, error } = await supabase
      .from('events')
      .select(
        'id,couple_id,user_id,title,event_date,event_time,description,type,repeat,created_at,updated_at'
      )
      .eq('couple_id', coupleId)
      .order('event_date', { ascending: true })
    if (error) throw error
    return (data ?? []) as CalendarEvent[]
  },
  async create(
    event: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>
  ): Promise<CalendarEvent> {
    const { data, error } = await supabase.from('events').insert(event).select().single()
    if (error) throw error
    return data as CalendarEvent
  },
}
