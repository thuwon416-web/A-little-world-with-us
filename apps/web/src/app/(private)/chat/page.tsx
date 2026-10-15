'use client'

import RealtimeChat from '@/features/chat/RealtimeChat'

export default function ChatPage() {
  return (
    <div className="mx-auto flex h-[calc(100dvh-7.5rem)] md:h-[calc(100dvh-6.5rem)] w-full max-w-5xl flex-col overflow-hidden">
      <header className="sr-only">
        <h1>Chat</h1>
      </header>
      <RealtimeChat className="h-full w-full flex-1" />
    </div>
  )
}
