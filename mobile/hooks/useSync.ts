import { useCallback, useEffect, useState } from 'react'

import { useNetwork } from './useNetwork'

import { subscribeToChanges, syncMessages, type SyncStatus } from '@/services/sync'

export function useSync(coupleId?: string) {
  const { isConnected } = useNetwork()
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [pendingCount, setPendingCount] = useState(0)

  const refresh = useCallback(async () => {
    setStatus('syncing')

    try {
      const result = await syncMessages()
      setPendingCount(result.pending)
      setStatus('synced')
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    if (!isConnected) {
      setStatus('idle')
      return
    }

    void refresh()
  }, [isConnected, refresh])

  useEffect(() => {
    if (!coupleId) return
    const subscription = subscribeToChanges(() => void refresh(), coupleId)
    return () => subscription.unsubscribe()
  }, [coupleId, refresh])

  return {
    status,
    pendingCount,
    isOffline: !isConnected,
    refresh,
  }
}
