export function pageview(url: string) {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_GA_ID) {
    // @ts-expect-error - gtag is injected by Google Analytics script
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
      page_path: url,
    })
  }
}

export function event(action: string, category: string, label: string, value?: number) {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_GA_ID) {
    // @ts-expect-error - gtag is injected by Google Analytics script
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

export function trackFeatureUsage(feature: string) {
  event('feature_used', 'engagement', feature)
}
