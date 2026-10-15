const DEFAULT_STUN_SERVERS = [
  'stun:stun.l.google.com:19302',
  'stun:stun1.l.google.com:19302',
  'stun:stun2.l.google.com:19302',
  'stun:stun.cloudflare.com:3478',
]

function getTurnUrls(): string[] {
  return (process.env.NEXT_PUBLIC_TURN_URLS ?? '')
    .split(',')
    .map((url) => url.trim())
    .filter((url) => url.startsWith('turn:') || url.startsWith('turns:'))
}

export function getCallIceConfiguration(): RTCConfiguration {
  const turnUrls = getTurnUrls()
  const username = process.env.NEXT_PUBLIC_TURN_USERNAME?.trim()
  const credential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL?.trim()

  const iceServers: RTCIceServer[] = DEFAULT_STUN_SERVERS.map((url) => ({ urls: url }))

  if (turnUrls.length > 0 && username && credential) {
    iceServers.push({
      urls: turnUrls,
      username,
      credential,
    })
  }

  return { iceServers }
}
