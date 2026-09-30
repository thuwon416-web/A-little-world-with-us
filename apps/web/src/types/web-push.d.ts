declare module 'web-push' {
  export interface PushSubscription {
    endpoint: string
    expirationTime?: number | null
    keys: { p256dh: string; auth: string }
  }

  export interface WebPushError extends Error {
    statusCode?: number
  }

  const webPush: {
    setVapidDetails(subject: string, publicKey: string, privateKey: string): void
    sendNotification(subscription: PushSubscription, payload?: string): Promise<void>
  }

  export default webPush
}
