import { Reply as ReplyIcon, Send, X } from 'lucide-react-native'
import { useState } from 'react'
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

import type { NativeChatMessage } from './chat-types'

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
              <ReplyIcon color="#b88ae5" size={20} />
              <Text style={styles.title}>Reply to message</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X color="#f3f0f5" size={22} />
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
            placeholderTextColor="#8d8d99"
            multiline
            style={styles.input}
          />
          <TouchableOpacity
            style={[styles.send, (!text.trim() || sending) && styles.disabled]}
            disabled={!text.trim() || sending}
            onPress={() => void send()}
          >
            <Send color="#fff" size={17} />
            <Text style={styles.sendText}>{sending ? 'Sending...' : 'Send reply'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#0008', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#171b22', borderRadius: 24, padding: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: '#f3f0f5', fontSize: 19, fontWeight: '700' },
  context: {
    borderLeftWidth: 3,
    borderLeftColor: '#b88ae5',
    backgroundColor: '#252a34',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  author: { color: '#b88ae5', fontSize: 12, fontWeight: '700', marginBottom: 5 },
  preview: { color: '#f3f0f5' },
  input: {
    minHeight: 100,
    backgroundColor: '#252a34',
    borderRadius: 14,
    color: '#fff',
    padding: 14,
    textAlignVertical: 'top',
  },
  send: {
    marginTop: 14,
    backgroundColor: '#b88ae5',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  sendText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.45 },
})
