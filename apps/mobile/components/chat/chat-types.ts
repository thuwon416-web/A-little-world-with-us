export type ChatMessageType =
  'text' | 'voice' | 'photo' | 'sticker' | 'gif' | 'file' | 'video' | 'audio' | 'location' | 'sos'

export type NativeChatMessage = {
  id: string
  senderId?: string
  content?: string
  messageType?: ChatMessageType
  mediaUrl?: string | null
  mediaPath?: string | null
  mediaDuration?: number | null
  replyTo?: string | null
  createdAt?: string
  editedAt?: string | null
  transcript?: string | null
}

export type ChatAttachment = {
  uri: string
  name: string
  mimeType: string
  size?: number
}
