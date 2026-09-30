import { useCallback, useEffect, useState } from 'react'

import { useNetwork } from './useNetwork'

import { subscribeToChanges, syncMessages, type SyncStatus } from '@/services/sync'

export function useSync(coupleId?: string) {
  const { isConnected } = useNetwork()
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [pendingCount, setPendingCount] = useState(0)

  const refresh = useCallback(async () => {
    if (!isConnected) return

    setStatus('syncing')

    try {
      // Full reconciliation is intentional: it catches edits and deletions that
      // an incremental created_at query could otherwise miss.
      const result = await syncMessages()
      setPendingCount(result.pending)
      setStatus('synced')
    } catch {
      setStatus('error')
    }
  }, [isConnected])

  useEffect(() => {
    if (!isConnected) {
      setStatus('idle')
      return
    }

    void refresh()
  }, [isConnected, refresh])

  useEffect(() => {
    if (!coupleId) return

    const subscription = subscribeToChanges(
      () => void refresh(),
      (subscriptionStatus) => {
        if (subscriptionStatus === 'SUBSCRIBED') {
          void refresh()
        } else if (
          subscriptionStatus === 'CHANNEL_ERROR' ||
          subscriptionStatus === 'TIMED_OUT' ||
          subscriptionStatus === 'CLOSED'
        ) {
          setStatus('error')
        }
      },
      coupleId
    )

    return () => subscription.unsubscribe()
  }, [coupleId, refresh])

  return {
    status,
    pendingCount,
    isOffline: !isConnected,
    refresh,
  }
}
