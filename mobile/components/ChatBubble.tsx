import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { MapPin, Siren } from 'lucide-react-native'

export type ChatMessage = {
  id: string
  sender: 'me' | 'them'
  text: string
  time: string
  type?: 'text' | 'location' | 'sos'
  location?: { latitude: number; longitude: number; accuracy?: number } | null
}

interface ChatBubbleProps {
  message: ChatMessage
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isMe = message.sender === 'me'

  return (
    <View style={[styles.row, isMe ? styles.rowMe : styles.rowThem]}>
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
        {message.type === 'location' && message.location ? (
          <TouchableOpacity
            onPress={() => {
              void Linking.openURL(
                `https://www.google.com/maps?q=${message.location?.latitude},${message.location?.longitude}`
              ).catch((error) => console.error('Unable to open location link', error))
            }}
          >
            <View style={styles.locationHeading}>
              <MapPin size={16} color="#f3f0f5" accessibilityLabel="Location" />
              <Text style={styles.locationTitle}>Shared location</Text>
            </View>
            <Text style={styles.text}>
              {message.location.latitude.toFixed(5)}, {message.location.longitude.toFixed(5)}
            </Text>
          </TouchableOpacity>
        ) : message.type === 'sos' ? (
          <View style={styles.locationHeading}>
            <Siren size={16} color="#ffd3dc" accessibilityLabel="Emergency" />
            <Text style={styles.sosText}>Emergency SOS - open location details</Text>
          </View>
        ) : (
          <Text style={styles.text}>{message.text}</Text>
        )}
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
  locationTitle: { color: '#f3f0f5', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  locationHeading: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sosText: { color: '#ffd3dc', fontSize: 15, fontWeight: '700' },
  time: {
    color: '#8d8d99',
    fontSize: 10,
    marginTop: 4,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
})
