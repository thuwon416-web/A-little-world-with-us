import { Audio } from 'expo-av'
import { Pause, Play, Volume2 } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import type { ChatMessage } from '@/components/ChatBubble'

type Props = { messages: ChatMessage[] }

export function VoiceMessageGallery({ messages }: Props) {
  const voiceMessages = messages.filter((message) => message.type === 'voice' && message.mediaUrl)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [sound, setSound] = useState<Audio.Sound | null>(null)

  useEffect(() => () => { if (sound) void sound.unloadAsync() }, [sound])
  if (!voiceMessages.length) return null

  const toggle = async (message: ChatMessage) => {
    if (!message.mediaUrl) return
    if (activeId === message.id && sound) {
      await sound.pauseAsync()
      setActiveId(null)
      return
    }
    if (sound) await sound.unloadAsync()
    const result = await Audio.Sound.createAsync({ uri: message.mediaUrl }, { shouldPlay: true })
    result.sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) setActiveId(null)
    })
    setSound(result.sound)
    setActiveId(message.id)
  }

  return <View style={styles.wrapper}>
    <View style={styles.heading}><Volume2 color="#d9bfd7" size={15} /><Text style={styles.title}>Voice notes</Text></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
      {voiceMessages.map((message) => <TouchableOpacity key={message.id} style={styles.item} onPress={() => void toggle(message)}>
        {activeId === message.id ? <Pause color="#fff" size={14} /> : <Play color="#fff" size={14} />}
        <Text style={styles.label}>{message.sender === 'me' ? 'You' : 'Partner'}{message.mediaDuration ? ` · ${message.mediaDuration}s` : ''}</Text>
      </TouchableOpacity>)}
    </ScrollView>
  </View>
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 10 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  title: { color: '#d9bfd7', fontSize: 12, fontWeight: '700' },
  list: { gap: 8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#252a34', borderRadius: 14, paddingHorizontal: 11, paddingVertical: 8 },
  label: { color: '#f3f0f5', fontSize: 11 },
})
