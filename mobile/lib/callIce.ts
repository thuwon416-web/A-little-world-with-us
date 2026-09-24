import type { RTCConfiguration } from 'react-native-webrtc'

const DEFAULT_STUN_URL = 'stun:stun.l.google.com:19302'

function getTurnUrls() {
  return (process.env.EXPO_PUBLIC_TURN_URLS ?? '')
    .split(',')
    .map((url) => url.trim())
    .filter((url) => url.startsWith('turn:') || url.startsWith('turns:'))
}

/**
 * Uses STUN for ordinary networks and an optional TURN relay for restrictive
 * mobile networks. Public Expo variables are bundled into the app, so a TURN
 * provider should issue short-lived credentials.
 */
export function getCallIceConfiguration(): RTCConfiguration {
  const urls = getTurnUrls()
  const username = process.env.EXPO_PUBLIC_TURN_USERNAME?.trim()
  const credential = process.env.EXPO_PUBLIC_TURN_CREDENTIAL?.trim()

  return {
    iceServers: [
      { urls: DEFAULT_STUN_URL },
      ...(urls.length > 0 && username && credential ? [{ urls, username, credential }] : []),
    ],
  }
}
