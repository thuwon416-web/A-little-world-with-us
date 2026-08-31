'use client'

import { useEffect } from 'react'
import { logError } from '@/lib/errorLogger'

/**
 * Registers the custom service worker for PWA support.
 * Runs only in the browser.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        logError(error, { source: 'service-worker-registration' })
      })
    }
  }, [])

  return null
}
