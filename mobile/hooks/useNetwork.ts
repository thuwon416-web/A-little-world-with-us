import NetInfo from '@react-native-community/netinfo'
import { useEffect, useState } from 'react'

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
    })

    return unsubscribe
  }, [])

  return {
    ...state,
    isConnected: Boolean(state.isConnected),
    isOffline: !state.isConnected,
  }
}
