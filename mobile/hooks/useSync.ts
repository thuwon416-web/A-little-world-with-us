import { useCallback, useEffect, useState } from 'react'
import { syncMessages, type SyncStatus } from '@/services/sync'
import { useNetwork } from './useNetwork'

export function useSync() {
  const { isConnected } = useNetwork()
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [pendingCount, setPendingCount] = useState(0)

  const refresh = useCallback(async () => {
    setStatus('syncing')

    try {
      const result = await syncMessages()
      setPendingCount(result.pending)
      setStatus('synced')
    } catch (_error) {
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

  return {
    status,
    pendingCount,
    isOffline: !isConnected,
    refresh,
  }
}
