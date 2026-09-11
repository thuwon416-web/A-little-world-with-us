import { Smile, X } from 'lucide-react-native'
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

type Props = { visible: boolean; onClose: () => void; onSelect: (emoji: string) => Promise<void> }
const stickers = ['❤️', '🥰', '😊', '😂', '🤗', '😘', '✨', '🌙', '☕', '🫶', '🙈', '💜', '🌸', '🎉', '🤍', '😌']

export function StickerPicker({ visible, onClose, onSelect }: Props) {
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={styles.overlay}><View style={styles.card}>
    <View style={styles.header}><View style={styles.heading}><Smile color="#b88ae5" size={20} /><Text style={styles.title}>Stickers</Text></View><TouchableOpacity onPress={onClose}><X color="#f3f0f5" size={22} /></TouchableOpacity></View>
    <View style={styles.grid}>{stickers.map((sticker) => <TouchableOpacity key={sticker} style={styles.sticker} onPress={() => void onSelect(sticker)} accessibilityLabel={`Send ${sticker} sticker`}><Text style={styles.emoji}>{sticker}</Text></TouchableOpacity>)}</View>
  </View></View></Modal>
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#0008', justifyContent: 'flex-end' },
  card: { backgroundColor: '#171b22', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  heading: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  title: { color: '#f3f0f5', fontSize: 20, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  sticker: { width: '21%', aspectRatio: 1, backgroundColor: '#252a34', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 30 },
})
