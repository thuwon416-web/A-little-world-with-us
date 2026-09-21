import { onCLS, onLCP, onINP, onTTFB, Metric } from 'web-vitals'

function sendToAnalytics(metric: Metric) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', metric.name, metric.value)
  }
  // In production, send to Vercel Analytics or your endpoint
  // Example:
  // fetch('/api/analytics', {
  //   method: 'POST',
  //   body: JSON.stringify(metric),
  // })
}

export function reportWebVitals() {
  onCLS(sendToAnalytics)
  onLCP(sendToAnalytics)
  onINP(sendToAnalytics)
  onTTFB(sendToAnalytics)
}
