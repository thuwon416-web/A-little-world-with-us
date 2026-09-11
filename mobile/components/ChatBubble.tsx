import { Audio } from 'expo-av'
import { FileText, MapPin, Play, Reply, Siren, Square, Trash2 } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Alert, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import type { ChatMessageType, NativeChatMessage } from './chat/chat-types'

export type ChatMessage = NativeChatMessage & {
  sender: 'me' | 'them'
  text: string
  time: string
  type?: ChatMessageType
  location?: { latitude: number; longitude: number; accuracy?: number } | null
}

type Props = {
  message: ChatMessage
  onReply?: (message: ChatMessage) => void
  onReplyContext?: () => void
  replyPreview?: string
  highlighted?: boolean
  onDelete?: (message: ChatMessage) => void
}

export function ChatBubble({ message, onReply, onReplyContext, replyPreview, highlighted, onDelete }: Props) {
  const [sound, setSound] = useState<Audio.Sound | null>(null)
  const [playing, setPlaying] = useState(false)
  const isMe = message.sender === 'me'
  useEffect(() => () => { if (sound) void sound.unloadAsync() }, [sound])
  const toggleAudio = async () => {
    if (!message.mediaUrl) return
    if (sound) {
      if (playing) { await sound.pauseAsync(); setPlaying(false) }
      else { await sound.playAsync(); setPlaying(true) }
      return
    }
    const result = await Audio.Sound.createAsync({ uri: message.mediaUrl }, { shouldPlay: true })
    result.sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) setPlaying(false)
    })
    setSound(result.sound)
    setPlaying(true)
  }
  const remove = () => Alert.alert('Delete message?', 'This removes the attachment and message for both partners.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => onDelete?.(message) },
  ])
  return   <View style={[styles.row, isMe ? styles.rowMe : styles.rowThem, highlighted && styles.highlightedRow]}>
    <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
    {message.replyTo && <TouchableOpacity onPress={onReplyContext} disabled={!onReplyContext} style={styles.replyContext}><Text style={styles.replyLabel}>Replying to:</Text><Text style={styles.replyPreview} numberOfLines={2}>{replyPreview || 'an earlier message'}</Text></TouchableOpacity>}
      {message.type === 'location' && message.location ? <TouchableOpacity onPress={() => void Linking.openURL(`https://www.google.com/maps?q=${message.location?.latitude},${message.location?.longitude}`).catch((error) => console.error('Unable to open location link', error))}><View style={styles.heading}><MapPin size={16} color="#f3f0f5" /><Text style={styles.locationTitle}>Shared location</Text></View><Text style={styles.text}>{message.location.latitude.toFixed(5)}, {message.location.longitude.toFixed(5)}</Text></TouchableOpacity>
        : message.type === 'sos' ? <View style={styles.heading}><Siren size={16} color="#ffd3dc" /><Text style={styles.sosText}>Emergency SOS</Text></View>
        : message.type === 'photo' && message.mediaUrl ? <Image source={{ uri: message.mediaUrl }} style={styles.photo} onError={() => console.warn('Unable to load chat photo')} />
        : message.type === 'voice' || message.type === 'audio' ? <TouchableOpacity style={styles.mediaRow} onPress={() => void toggleAudio()}><View style={styles.mediaIcon}>{playing ? <Square color="#fff" size={15} /> : <Play color="#fff" size={15} />}</View><Text style={styles.text}>{playing ? 'Playing voice note' : `Voice note${message.mediaDuration ? ` · ${message.mediaDuration}s` : ''}`}</Text></TouchableOpacity>
        : message.type === 'gif' && message.mediaUrl ? <Image source={{ uri: message.mediaUrl }} style={styles.gif} onError={() => console.warn('Unable to load GIF')} />
        : message.type === 'file' && message.mediaUrl ? <TouchableOpacity style={styles.mediaRow} onPress={() => void Linking.openURL(message.mediaUrl!).catch((error) => console.error('Unable to open attachment', error))}><FileText color="#fff" size={20} /><Text style={styles.text} numberOfLines={1}>{message.content || 'Open attachment'}</Text></TouchableOpacity>
        : <Text style={styles.text}>{message.type === 'sticker' ? message.content : message.text}</Text>}
      <View style={styles.actions}>{onReply && <TouchableOpacity onPress={() => onReply(message)} accessibilityLabel="Reply to message"><Reply color="#d9bfd7" size={15} /></TouchableOpacity>}{isMe && onDelete && message.type !== 'text' && <TouchableOpacity onPress={remove} accessibilityLabel="Delete message"><Trash2 color="#ffb5bd" size={15} /></TouchableOpacity>}</View>
    </View>
    <Text style={styles.time}>{message.time}</Text>
  </View>
}

const styles = StyleSheet.create({
  row: { flexDirection: 'column', marginBottom: 8 },
  rowMe: { alignItems: 'flex-end' },
  rowThem: { alignItems: 'flex-start' },
  bubble: { maxWidth: '84%', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16 },
  bubbleMe: { backgroundColor: '#b88ae5', borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: '#171b22', borderBottomLeftRadius: 4 },
  text: { color: '#f3f0f5', fontSize: 15, lineHeight: 21, flexShrink: 1 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationTitle: { color: '#f3f0f5', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  sosText: { color: '#ffd3dc', fontSize: 15, fontWeight: '700' },
  replyContext: { color: '#ead8f4', fontSize: 11, marginBottom: 6, fontStyle: 'italic' },
  replyLabel: { color: '#ead8f4', fontSize: 11, fontStyle: 'italic' },
  replyPreview: { color: '#f3f0f5', fontSize: 12, marginTop: 2 },
  highlightedRow: { backgroundColor: '#b88ae522', borderRadius: 20, padding: 4, marginHorizontal: -4 },
  photo: { width: 220, height: 180, borderRadius: 12 },
  gif: { width: 220, height: 150, borderRadius: 12 },
  mediaRow: { flexDirection: 'row', alignItems: 'center', gap: 9, maxWidth: 220 },
  mediaIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#6f4d8f', alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end', marginTop: 8 },
  time: { color: '#8d8d99', fontSize: 10, marginTop: 4, letterSpacing: 1, textTransform: 'uppercase' },
})
