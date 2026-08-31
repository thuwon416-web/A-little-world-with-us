'use client'

import { useEffect, useRef } from 'react'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

type RealtimeSyncConfig<T> = {
  table: string
  filter?: string
  event?: RealtimeEvent
  onChange: (row: T, eventType: RealtimeEvent) => void
}

type RowWithTimestamps = {
  created_at?: string | null
  updated_at?: string | null
}

export function useRealtimeSync<T extends RowWithTimestamps>({
  table,
  filter,
  event = '*',
  onChange,
}: RealtimeSyncConfig<T>) {
  const lastUpdatedAtRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return
    }

    const channel = supabase.channel(`${table}-sync`)

    const callback = (payload: {
      eventType?: RealtimeEvent
      new?: T | null
      old?: T | null
    }) => {
      const row = (payload.new ?? payload.old ?? null) as T | null

      if (!row) {
        return
      }

      const nextUpdatedAt = row.updated_at ?? row.created_at ?? new Date().toISOString()
      const currentUpdatedAt = lastUpdatedAtRef.current

      const shouldApplyRemoteChange =
        !currentUpdatedAt || new Date(nextUpdatedAt).getTime() >= new Date(currentUpdatedAt).getTime()

      if (!shouldApplyRemoteChange) {
        return
      }

      lastUpdatedAtRef.current = nextUpdatedAt
      onChange(row, payload.eventType ?? event)
    }

    const subscriptionConfig: any = {
      event: event === '*' ? '*' : event,
      schema: 'public',
      table,
    }

    if (filter) {
      subscriptionConfig.filter = filter
    }

    channel.on('postgres_changes' as any, subscriptionConfig as any, callback as any)
    void channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, filter, event, onChange])
}
