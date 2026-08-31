import { useMemo, useState } from 'react'

import { ChatMessage } from '@/components/ChatBubble'

const initialMessages: ChatMessage[] = [
  { id: '1', sender: 'them', text: 'Morning love. Ready to make today gentle?', time: 'Today' },
  {
    id: '2',
    sender: 'me',
    text: 'Always. I am already thinking of our little ritual.',
    time: 'Today',
  },
  { id: '3', sender: 'them', text: 'Then let’s keep it light and warm.', time: 'Today' },
]

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)

  const sendMessage = (text: string) => {
    setMessages((current) => [
      ...current,
      {
        id: `${Date.now()}`,
        sender: 'me',
        text,
        time: 'Now',
      },
    ])
  }

  return useMemo(() => ({ messages, sendMessage }), [messages])
}
