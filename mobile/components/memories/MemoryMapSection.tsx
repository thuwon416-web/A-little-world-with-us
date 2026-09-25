import { Camera, MapView, PointAnnotation } from '@maplibre/maplibre-react-native'
import { useRouter } from 'expo-router'
import { X } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@/context/ThemeContext'
import type { ThemeColors } from '@/context/ThemeContext'
import { sizes, type Sizes } from '@/design-tokens'
import { downloadDecryptAndCache } from '@/lib/mediaEncryption'
import { supabase } from '@/lib/supabase'
import { getMemories, type MemoryRecord } from '@/services/memories'

function isExternalUrl(v?: string | null) {
  return !!v && (v.startsWith('http://') || v.startsWith('https://'))
}

const mapStyle =
  process.env.EXPO_PUBLIC_CARTO_STYLE_URL ??
  'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

export default function MemoryMapSection() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const styles = createStyles(colors, sizes, insets.top)
  const router = useRouter()
  const [memories, setMemories] = useState<MemoryRecord[]>([])
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [selected, setSelected] = useState<MemoryRecord | null>(null)
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const { data: coupleLink } = await supabase
        .from('couple_links')
        .select('couple_id')
        .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
        .eq('status', 'accepted')
        .maybeSingle()
      setCoupleId(coupleLink?.couple_id ?? null)
      const rows = await getMemories()
      setMemories(rows.filter((row) => row.latitude !== null && row.longitude !== null))
    }
    void loadData().catch((caught) =>
      setError(caught instanceof Error ? caught.message : 'Unable to load memory locations.')
    )
  }, [])
  useEffect(() => {
    let mounted = true
    void Promise.all(
      memories.map(async (memory) => {
        const path = memory.storage_path ?? memory.image_url
        if (!path || path.startsWith('/') || path.startsWith('http'))
          return path ? ([memory.id, path] as const) : null
        if (isExternalUrl(path)) {
          const { data } = await supabase.storage.from('memories').createSignedUrl(path, 3600)
          return data?.signedUrl ? ([memory.id, data.signedUrl] as const) : null
        }
        if (!coupleId) return null
        const mimeType = memory.mime_type || 'image/jpeg'
        const uri = await downloadDecryptAndCache(coupleId, 'memories', path, mimeType)
        return [memory.id, uri] as const
      })
    ).then((entries) => {
      if (mounted)
        setUrls(
          Object.fromEntries(
            entries.filter((entry): entry is readonly [string, string] => entry !== null)
          )
        )
    })
    return () => {
      mounted = false
    }
  }, [memories, coupleId])
  const center = useMemo<[number, number]>(
    () =>
      memories[0]
        ? [memories[0].longitude as number, memories[0].latitude as number]
        : [96.1951, 16.8661],
    [memories]
  )
  if (error)
    return (
      <View style={[styles.empty, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.error }}>{error}</Text>
      </View>
    )
  if (!memories.length)
    return (
      <View style={[styles.empty, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>No located memories yet.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.accent1 }}>Back</Text>
        </TouchableOpacity>
      </View>
    )
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <MapView style={styles.map} mapStyle={mapStyle} logoEnabled={false}>
        <Camera centerCoordinate={center} zoomLevel={4} />
        <>
          {memories.map((memory) => (
            <PointAnnotation
              key={memory.id}
              id={memory.id}
              coordinate={[memory.longitude as number, memory.latitude as number]}
              onSelected={() => setSelected(memory)}
            >
              <View
                style={[
                  styles.marker,
                  { backgroundColor: colors.accent1, borderColor: colors.textPrimary },
                ]}
              />
            </PointAnnotation>
          ))}
        </>
      </MapView>
      <TouchableOpacity
        style={[styles.back, { backgroundColor: colors.cardBg }]}
        onPress={() => router.back()}
      >
        <X color={colors.textPrimary} size={22} />
      </TouchableOpacity>
      <Modal
        visible={selected !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View style={[styles.sheet, { backgroundColor: colors.cardBg }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {selected?.title ?? 'A memory together'}
          </Text>
          <Text style={{ color: colors.textSecondary }}>
            {selected?.location_label ?? 'Located memory'} · {selected?.date}
          </Text>
          {selected && urls[selected.id] ? (
            <Image
              source={{ uri: urls[selected.id] }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ) : null}
          <TouchableOpacity onPress={() => setSelected(null)}>
            <Text style={{ color: colors.accent1 }}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  )
}

const createStyles = (colors: ThemeColors, sizes: Sizes, topInset: number) =>
  StyleSheet.create({
    map: { flex: 1 },
    marker: { width: 22, height: 22, borderRadius: 11, borderWidth: 3 },
    back: {
      position: 'absolute',
      top: topInset + 8,
      left: 18,
      borderRadius: sizes.radius.card,
      padding: 10,
    },
    sheet: {
      marginTop: 'auto',
      borderTopLeftRadius: sizes.radius.card,
      borderTopRightRadius: sizes.radius.card,
      padding: 24,
      gap: 10,
    },
    thumbnail: { width: '100%', height: 180, borderRadius: sizes.radius.input },
    title: { fontSize: sizes.text.hSm, fontWeight: '700' },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  })
