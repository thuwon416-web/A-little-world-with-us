'use client'

import dynamic from 'next/dynamic'

const AIChatWidget = dynamic(
  () => import('@/components/AIChatWidget'),
  {
    ssr: false,
    loading: () => null,
  }
)

export default function AIChatWidgetLoader() {
  return <AIChatWidget />
}
