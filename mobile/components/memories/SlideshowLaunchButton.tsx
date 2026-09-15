import { Play } from 'lucide-react-native'
import { Text, TouchableOpacity } from 'react-native'
import { useTheme } from '@/context/ThemeContext'
import type { MemoryRecord } from '@/services/memories'

export default function SlideshowLaunchButton({ memories, onPress }: { memories: MemoryRecord[]; onPress: () => void }) {
  const { colors } = useTheme()
  if (memories.filter((memory) => memory.image_url).length < 2) return null
  return (
    <TouchableOpacity onPress={onPress} style={{ backgroundColor: colors.accent1, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <Play color={colors.background} size={16} />
      <Text style={{ color: colors.background, fontWeight: '700' }}>Play Slideshow</Text>
    </TouchableOpacity>
  )
}
