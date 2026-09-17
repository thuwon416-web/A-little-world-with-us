import { Reply as ReplyIcon, Send, X } from 'lucide-react-native'
import { useState } from 'react'
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

import type { NativeChatMessage } from './chat-types'
import { useTheme } from '@/context/ThemeContext'

type Props = {
  visible: boolean
  message: NativeChatMessage | null
  currentUserId: string | null
  onClose: () => void
  onReply: (text: string, replyTo: string) => Promise<void>
}

function preview(message: NativeChatMessage) {
  if (message.messageType === 'text') return message.content || 'Text message'
  if (message.messageType === 'photo') return 'Photo'
  if (message.messageType === 'voice') return 'Voice message'
  if (message.messageType === 'file') return message.content || 'File'
  if (message.messageType === 'gif') return 'GIF'
  if (message.messageType === 'sticker') return `${message.content || 'Sticker'} sticker`
  return 'Message'
}

export function ReplyThread({ visible, message, currentUserId, onClose, onReply }: Props) {
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  if (!message) return null
  const send = async () => {
    if (!text.trim()) return
    setSending(true)
    try {
      await onReply(text.trim(), message.id)
      setText('')
      onClose()
    } finally {
      setSending(false)
    }
  }
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.heading}>
              <ReplyIcon color={colors.accent1} size={20} />
              <Text style={styles.title}>Reply to message</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X color={colors.textPrimary} size={22} />
            </TouchableOpacity>
          </View>
          <View style={styles.context}>
            <Text style={styles.author}>
              {message.senderId === currentUserId ? 'You' : 'Partner'}
            </Text>
            <Text style={styles.preview}>{preview(message)}</Text>
          </View>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Write your reply..."
            placeholderTextColor={colors.textSecondary}
            multiline
            style={styles.input}
          />
          <TouchableOpacity
            style={[styles.send, (!text.trim() || sending) && styles.disabled]}
            disabled={!text.trim() || sending}
            onPress={() => void send()}
          >
            <Send color={colors.background} size={17} />
            <Text style={styles.sendText}>{sending ? 'Sending...' : 'Send reply'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#0008', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: colors.surface, borderRadius: 24, padding: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: colors.textPrimary, fontSize: 19, fontWeight: '700' },
  context: {
    borderLeftWidth: 3,
    borderLeftColor: colors.accent1,
    backgroundColor: colors.cardBg,
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  author: { color: colors.accent1, fontSize: 12, fontWeight: '700', marginBottom: 5 },
  preview: { color: colors.textPrimary },
  input: {
    minHeight: 100,
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    color: colors.textPrimary,
    padding: 14,
    textAlignVertical: 'top',
  },
  send: {
    marginTop: 14,
    backgroundColor: colors.accent1,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  sendText: { color: colors.background, fontWeight: '700' },
  disabled: { opacity: 0.45 },
})
