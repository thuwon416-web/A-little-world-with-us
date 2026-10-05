import * as Sentry from '@sentry/nextjs'

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.05,
    beforeSend(event) {
      if (event.user) {
        delete event.user.email
        delete event.user.ip_address
        delete event.user.name
      }
      if (event.request) {
        delete event.request.cookies
        delete event.request.headers
        if (event.request.data) event.request.data = '[REDACTED_REQUEST_BODY]'
      }
      return event
    },
  })
}
