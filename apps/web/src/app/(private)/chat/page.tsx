'use client'

import RealtimeChat from '@/features/chat/RealtimeChat'

export default function ChatPage() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-4 sm:px-6 lg:py-6" aria-labelledby="chat-title">
      <header className="sr-only">
        <h1 id="chat-title">Chat</h1>
      </header>
      <section className="ui-panel min-h-[calc(100dvh-8rem)] overflow-hidden p-2 sm:p-4" aria-label="Conversation">
        <RealtimeChat />
      </section>
    </main>
  )
}
