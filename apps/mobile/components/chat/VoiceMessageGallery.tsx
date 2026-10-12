import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import { Pause, Play, Volume2 } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import type { ChatMessage } from '@/components/ChatBubble'
import { useTheme } from '@/context/ThemeContext'

type Props = { messages: ChatMessage[] }

export function VoiceMessageGallery({ messages }: Props) {
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const voiceMessages = messages.filter((message) => message.type === 'voice' && message.mediaUrl)
  const [activeId, setActiveId] = useState<string | null>(null)
  const player = useAudioPlayer(null)
  const status = useAudioPlayerStatus(player)

  useEffect(() => {
    if (status.didJustFinish) {
      setActiveId(null)
    }
  }, [status.didJustFinish])

  useEffect(
    () => () => {
      player.remove()
    },
    [player]
  )

  if (!voiceMessages.length) return null

  const toggle = async (message: ChatMessage) => {
    if (!message.mediaUrl) return
    if (activeId === message.id) {
      if (status.playing) {
        player.pause()
      } else {
        player.play()
      }
      return
    }
    player.replace({ uri: message.mediaUrl })
    player.play()
    setActiveId(message.id)
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.heading}>
        <Volume2 color={colors.accent2} size={15} />
        <Text style={styles.title}>Voice notes</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {voiceMessages.map((message) => {
          const isActive = activeId === message.id
          const isPlaying = isActive && status.playing
          return (
            <TouchableOpacity
              key={message.id}
              style={styles.item}
              onPress={() => void toggle(message)}
            >
              {isPlaying ? (
                <Pause color={colors.background} size={14} />
              ) : (
                <Play color={colors.background} size={14} />
              )}
              <Text style={styles.label}>
                {message.sender === 'me' ? 'You' : 'Partner'}
                {message.mediaDuration ? ` · ${message.mediaDuration}s` : ''}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    wrapper: { marginBottom: 10 },
    heading: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    title: { color: colors.accent2, fontSize: 12, fontWeight: '700' },
    list: { gap: 8 },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.cardBg,
      borderRadius: 14,
      paddingHorizontal: 11,
      paddingVertical: 8,
    },
    label: { color: colors.textPrimary, fontSize: 11 },
  })