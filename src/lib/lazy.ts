import dynamic from 'next/dynamic'
import React from 'react'

export const LazyMemoryMap = dynamic(
  () => import('@/features/location/MemoryMap'),
  {
    loading: () => React.createElement('div', { className: 'animate-pulse h-64 bg-[var(--card-bg-strong)] rounded-lg' }),
    ssr: false,
  }
)

export const LazyChat = dynamic(
  () => import('@/features/chat/RealtimeChat'),
  {
    loading: () => React.createElement('div', { className: 'animate-pulse h-96 bg-[var(--card-bg-strong)] rounded-lg' }),
    ssr: false,
  }
)

export const LazyReminders = dynamic(
  () => import('@/features/settings/RemindersWidget'),
  {
    loading: () => React.createElement('div', { className: 'animate-pulse h-48 bg-[var(--card-bg-strong)] rounded-lg' }),
    ssr: false,
  }
)

export const LazyAstrology = dynamic(
  () => import('@/features/wellness/AstrologyWidget'),
  {
    loading: () => React.createElement('div', { className: 'animate-pulse h-64 bg-[var(--card-bg-strong)] rounded-lg' }),
    ssr: false,
  }
)
