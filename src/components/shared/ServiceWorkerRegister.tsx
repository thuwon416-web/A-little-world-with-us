'use client'

import { useEffect } from 'react'

/**
 * Registers the custom service worker for PWA support.
 * Runs only in the browser.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => {
          // Service worker registration failed - silently fail in production
        })
    }
  }, [])

  return null
}
