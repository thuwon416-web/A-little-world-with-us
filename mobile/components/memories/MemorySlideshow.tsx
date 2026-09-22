import { useEffect, useMemo, useRef, useState } from 'react'
import { Dimensions, FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Pause, Play, X } from 'lucide-react-native'
import { useTheme } from '@/context/ThemeContext'
import { downloadDecryptAndCache, guessMimeTypeFromPath } from '@/lib/mediaEncryption'
import { supabase } from '@/lib/supabase'
import type { MemoryRecord } from '@/services/memories'

function isExternalUrl(v?: string | null) {
  return !!v && (v.startsWith('http://') || v.startsWith('https://'))
}

const { width, height } = Dimensions.get('window')

export default function MemorySlideshow({ memories, onClose, coupleId }: { memories: MemoryRecord[]; onClose: () => void; coupleId: string }) {
  const { colors } = useTheme()
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [urls, setUrls] = useState<Record<string, string>>({})
  const listRef = useRef<FlatList<MemoryRecord>>(null)
  const photos = useMemo(() => memories.filter((memory) => memory.image_url), [memories])

  useEffect(() => {
    let mounted = true
    void Promise.all(photos.map(async (memory) => {
      const path = memory.storage_path ?? memory.image_url
      if (!path) return null
      if (path.startsWith('http') || path.startsWith('/')) return [memory.id, path] as const
      const mimeType = memory.mime_type || 'image/jpeg'
      const uri = await downloadDecryptAndCache(coupleId, 'memories', path, mimeType)
      return [memory.id, uri] as const
    })).then((entries) => {
      if (mounted) setUrls(Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => entry !== null)))
    })
    return () => { mounted = false }
  }, [photos, coupleId])

  useEffect(() => {
    if (!playing || photos.length < 2) return
    const timer = setInterval(() => {
      const next = (index + 1) % photos.length
      setIndex(next)
      listRef.current?.scrollToIndex({ index: next, animated: true })
    }, 5000)
    return () => clearInterval(timer)
  }, [index, photos.length, playing])

  if (!photos.length) return null
  return (
    <Modal visible animationType="fade" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={styles.close} onPress={onClose} accessibilityLabel="Close slideshow"><X color={colors.textPrimary} size={24} /></TouchableOpacity>
        <FlatList
          ref={listRef}
          data={photos}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          getItemLayout={(_, itemIndex) => ({ length: width, offset: width * itemIndex, index: itemIndex })}
          onMomentumScrollEnd={(event) => {
            const next = Math.round(event.nativeEvent.contentOffset.x / width)
            setIndex(next)
            setPlaying(false)
          }}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              {urls[item.id] ? <Image source={{ uri: urls[item.id] }} style={styles.image} resizeMode="contain" /> : <Text style={{ color: colors.textSecondary }}>Loading photo…</Text>}
              <View style={[styles.caption, { backgroundColor: colors.cardBg }]}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>{item.title || 'A memory together'}</Text>
                {item.caption && item.caption !== item.title ? <Text style={{ color: colors.textSecondary }}>{item.caption}</Text> : null}
                <Text style={{ color: colors.textSecondary }}>{item.date}</Text>
              </View>
            </View>
          )}
        />
        <View style={styles.controls}>
          <TouchableOpacity onPress={() => setPlaying((value) => !value)} style={[styles.control, { backgroundColor: colors.cardBg }]} accessibilityLabel={playing ? 'Pause slideshow' : 'Play slideshow'}>
            {playing ? <Pause color={colors.textPrimary} size={18} /> : <Play color={colors.textPrimary} size={18} />}
          </TouchableOpacity>
          <View style={styles.dots}>{photos.map((photo, photoIndex) => <View key={photo.id} style={[styles.dot, { backgroundColor: photoIndex === index ? colors.accent1 : colors.cardBorder }]} />)}</View>
          <Text style={{ color: colors.textSecondary }}>{index + 1} / {photos.length}</Text>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 48 },
  close: { position: 'absolute', right: 20, top: 48, zIndex: 2, padding: 8 },
  slide: { width, height: height - 130, alignItems: 'center', justifyContent: 'center', padding: 20 },
  image: { width: width - 40, height: height - 260 },
  caption: { width: '100%', borderRadius: 16, padding: 14, gap: 4 },
  title: { fontSize: 18, fontWeight: '700' },
  controls: { height: 82, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
  control: { borderRadius: 20, padding: 10 },
  dots: { flexDirection: 'row', gap: 5, maxWidth: width - 130, flexWrap: 'wrap', justifyContent: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4 },
})
