import { Smile, X } from 'lucide-react-native'
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useTheme } from '@/context/ThemeContext'

type Props = { visible: boolean; onClose: () => void; onSelect: (emoji: string) => Promise<void> }
const stickers = [
  '❤️',
  '🥰',
  '😊',
  '😂',
  '🤗',
  '😘',
  '✨',
  '🌙',
  '☕',
  '🫶',
  '🙈',
  '💜',
  '🌸',
  '🎉',
  '🤍',
  '😌',
]

export function StickerPicker({ visible, onClose, onSelect }: Props) {
  const { colors } = useTheme()
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <View style={styles.heading}>
              <Smile color={colors.accent1} size={20} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>Stickers</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X color={colors.textPrimary} size={22} />
            </TouchableOpacity>
          </View>
          <View style={styles.grid}>
            {stickers.map((sticker) => (
              <TouchableOpacity
                key={sticker}
                style={[styles.sticker, { backgroundColor: colors.surface }]}
                onPress={() => void onSelect(sticker)}
                accessibilityLabel={`Send ${sticker} sticker`}
              >
                <Text style={styles.emoji}>{sticker}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#0008', justifyContent: 'flex-end' },
  card: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heading: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  sticker: {
    width: '21%',
    aspectRatio: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 30 },
})
