import NetInfo from '@react-native-community/netinfo'
import { useEffect, useState } from 'react'

import { setNetworkStatus } from '@/lib/supabase'
import { flushOfflineQueue } from '@/services/sync'

export function useNetwork() {
  const [state, setState] = useState<any>({
    type: 'wifi',
    isConnected: true,
    isInternetReachable: true,
    details: null,
  })

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((nextState) => {
      setState(nextState)
      const connected = Boolean(nextState.isConnected && nextState.isInternetReachable !== false)
      setNetworkStatus(connected)
      if (connected) void flushOfflineQueue()
    })

    return unsubscribe
  }, [])

  return {
    ...state,
    isConnected: Boolean(state.isConnected),
    isOffline: !state.isConnected,
  }
}
