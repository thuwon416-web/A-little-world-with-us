import RealtimeChat from '@/features/chat/RealtimeChat'
import ChatHistoryExport from '@/features/chat/ChatHistoryExport'

export default function ChatPage() {
  return (
    <div className="space-y-6">
      <RealtimeChat />
      <ChatHistoryExport />
    </div>
  )
}
