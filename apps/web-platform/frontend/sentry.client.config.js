import * as Sentry from '@sentry/nextjs'

function redactEvent(event) {
  if (event.user) {
    delete event.user.email
    delete event.user.ip_address
    delete event.user.name
  }

  if (event.request) {
    delete event.request.cookies
    delete event.request.headers
    if (event.request.data) {
      event.request.data = '[REDACTED_REQUEST_BODY]'
    }
  }

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
      if (breadcrumb.data) return { ...breadcrumb, data: { note: '[REDACTED]' } }
      return breadcrumb
    })
  }

  return event
}

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.05,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 0.2,
    beforeSend: redactEvent,
  })
}
