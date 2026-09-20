'use client'
import { useState } from 'react'
import { MessageCircle } from 'lucide-react'

export default function MessageSuggestions() {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [context, setContext] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const generateSuggestions = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/ai/message-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context }),
      })
      const data = await response.json()
      setSuggestions(data.suggestions || [])
    } catch (error) {
      console.error('Message suggestions error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
  }

  return (
    <div className="p-4 bg-card rounded-btn border border-accent-1/20">
      <h3 className="mb-2 flex items-center gap-2 font-bold text-text-1"><MessageCircle className="h-4 w-4" /> Message Suggestions</h3>
      <input
        value={context}
        onChange={(e) => setContext(e.target.value)}
        placeholder="E.g., Good morning message for anniversary"
        className="w-full px-3 py-2 rounded-lg border border-accent-1/20 bg-card text-text-1 placeholder:text-text-2 mb-3"
      />
      <button
        onClick={generateSuggestions}
        disabled={isLoading}
        className="w-full bg-accent-1 text-white py-2 rounded-lg font-medium disabled:opacity-50 hover:opacity-90 transition"
      >
        {isLoading ? 'Generating...' : 'Generate Suggestions'}
      </button>
      {suggestions.length > 0 && (
        <div className="mt-4 space-y-2">
          {suggestions.map((suggestion, i) => (
            <div
              key={i}
              className="p-3 bg-card rounded-lg border border-accent-1/10 cursor-pointer hover:bg-card/60 transition"
              onClick={() => copyToClipboard(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
