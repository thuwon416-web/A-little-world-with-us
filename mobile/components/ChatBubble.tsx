import { StyleSheet, Text, View } from 'react-native'

export type ChatMessage = {
  id: string
  sender: 'me' | 'them'
  text: string
  time: string
}

interface ChatBubbleProps {
  message: ChatMessage
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isMe = message.sender === 'me'

  return (
    <View style={[styles.row, isMe ? styles.rowMe : styles.rowThem]}>
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
        <Text style={styles.text}>{message.text}</Text>
      </View>
      <Text style={styles.time}>{message.time}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'column',
    marginBottom: 8,
  },
  rowMe: {
    alignItems: 'flex-end',
  },
  rowThem: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
  },
  bubbleMe: {
    backgroundColor: '#b88ae5',
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: '#171b22',
    borderBottomLeftRadius: 4,
  },
  text: {
    color: '#f3f0f5',
    fontSize: 15,
    lineHeight: 21,
  },
  time: {
    color: '#8d8d99',
    fontSize: 10,
    marginTop: 4,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
})
