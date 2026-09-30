import 'server-only'

import webPush from 'web-push'

export function configureWebPush() {
  const publicKey = process.env.WEB_PUSH_PUBLIC_KEY
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY
  const subject = process.env.WEB_PUSH_SUBJECT

  if (!publicKey || !privateKey || !subject) {
    throw new Error('Web push environment is not configured.')
  }

  webPush.setVapidDetails(subject, publicKey, privateKey)
  return { publicKey, webPush }
}
