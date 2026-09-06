'use client'
import { useState } from 'react'

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      })

      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error.' }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 bg-[var(--accent-1)] text-white p-4 rounded-full shadow-lg z-50 hover:opacity-90 transition"
      >
        💬
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 w-80 bg-[var(--card-bg)] rounded-2xl shadow-xl z-50 overflow-hidden border border-[var(--accent-1)]/20">
          {/* Header */}
          <div className="bg-[var(--accent-1)] text-white p-4">
            <h3 className="font-bold">AI Assistant</h3>
            <p className="text-sm opacity-80">Your relationship companion</p>
          </div>

          {/* Messages */}
          <div className="h-64 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-[var(--text-secondary)] text-sm">
                <p>👋 Hi! I&apos;m your AI assistant.</p>
                <p className="mt-2">Ask me about relationship advice, date ideas, or anything else!</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-2xl max-w-[80%] ${
                  msg.role === 'user'
                    ? 'bg-[var(--accent-1)] text-white ml-auto'
                    : 'bg-[var(--card-bg-strong)] text-[var(--text-primary)] mr-auto'
                }`}
              >
                {msg.content}
              </div>
            ))}
            {isLoading && (
              <div className="text-[var(--text-secondary)] text-sm animate-pulse">AI is typing...</div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-[var(--accent-1)]/20">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask me anything..."
                className="flex-1 px-3 py-2 rounded-lg border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
              />
              <button
                onClick={sendMessage}
                disabled={isLoading}
                className="bg-[var(--accent-1)] text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 hover:opacity-90 transition"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
