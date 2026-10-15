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
  const pendingChangeRef = useRef<{ row: T; eventType: RealtimeEvent } | null>(null)
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      pendingChangeRef.current = { row, eventType: payload.eventType ?? event }
      if (flushTimerRef.current) return
      flushTimerRef.current = setTimeout(() => {
        flushTimerRef.current = null
        const pending = pendingChangeRef.current
        pendingChangeRef.current = null
        if (pending) onChange(pending.row, pending.eventType)
      }, 200)
    }

    const subscriptionConfig: {
      event: RealtimeEvent
      schema: 'public'
      table: string
      filter?: string
    } = {
      event: event === '*' ? '*' : event,
      schema: 'public',
      table,
    }

    if (filter) {
      subscriptionConfig.filter = filter
    }

    channel.on('postgres_changes' as never, subscriptionConfig as never, callback as never)
    void channel.subscribe()

    return () => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current)
      flushTimerRef.current = null
      pendingChangeRef.current = null
      supabase.removeChannel(channel)
    }
  }, [table, filter, event, onChange])
}
