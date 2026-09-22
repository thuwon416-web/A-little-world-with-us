import { useEffect, useMemo, useState } from 'react'
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import ImageUpload from '@/components/ImageUpload'
import { useTheme } from '@/context/ThemeContext'
import type { ThemeColors } from '@/context/ThemeContext'
import { sizes, type Sizes } from '@/design-tokens'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

type GalleryItem = {
  id: string
  path: string
  url: string
  name: string
  created_at: string
}

export default function GalleryScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => createStyles(colors, sizes), [colors])
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, loading: authLoading } = useAuth()

  const loadGallery = async () => {
    try {
      setLoading(true)
      if (!user?.id) return
      const { data, error } = await supabase.storage
        .from('gallery')
        .list(user.id, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })
      if (error) {
        throw error
      }

      const galleryItems = (
        await Promise.all(
          (data ?? [])
            .filter((item) => item.name && !item.metadata?.isFolder)
            .map(async (item) => {
              const path = `${user.id}/${item.name}`
              const { data: signed, error: signedError } = await supabase.storage
                .from('gallery')
                .createSignedUrl(path, 3600)
              if (signedError || !signed?.signedUrl) return null
              return {
                id: item.id ?? path,
                path,
                url: signed.signedUrl,
                name: item.name,
                created_at: item.created_at ?? new Date().toISOString(),
              }
            })
        )
      ).filter((item): item is GalleryItem => item !== null)

      setItems(galleryItems)
    } catch (caught) {
      setItems([])
      setError(caught instanceof Error ? caught.message : 'Unable to load gallery.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading) void loadGallery()
  }, [authLoading, user?.id])

  const handleUpload = (image: GalleryItem) => {
    setItems((current) => [image, ...current])
  }

  const handleDelete = (item: GalleryItem) => {
    Alert.alert('Delete photo?', 'This removes the photo from your shared gallery.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void supabase.storage
            .from('gallery')
            .remove([item.path])
            .then(({ error: deleteError }) => {
              if (deleteError) {
                setError(deleteError.message)
                return
              }
              setItems((current) => current.filter((candidate) => candidate.id !== item.id))
            })
        },
      },
    ])
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.eyebrow}>Gallery</Text>
      <Text style={styles.title}>Shared moments</Text>
      <Text style={styles.subtitle}>Save little snapshots of your story.</Text>

      <ImageUpload onUpload={handleUpload} />

      {error && <Text style={styles.error}>{error}</Text>}
      {loading || authLoading ? (
        <Text style={styles.loading}>Loading gallery…</Text>
      ) : items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No photos yet.</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {items.map((item) => (
            <View key={item.id} style={styles.card}>
              <Image
                source={{ uri: item.url }}
                style={styles.image}
                resizeMode="cover"
                onError={() =>
                  setItems((current) => current.filter((candidate) => candidate.id !== item.id))
                }
              />
              <View style={styles.metaRow}>
                <Text style={styles.meta}>{new Date(item.created_at).toLocaleDateString()}</Text>
                <TouchableOpacity onPress={() => handleDelete(item)}>
                  <Text style={styles.delete}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const createStyles = (colors: ThemeColors, sizes: Sizes) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: colors.background,
      paddingTop: 72,
      paddingHorizontal: 20,
      paddingBottom: 32,
    },
    eyebrow: {
      color: colors.accent2,
      fontSize: sizes.text.xs,
      letterSpacing: 2,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    title: {
      color: colors.textPrimary,
      fontSize: sizes.text.hLg,
      fontWeight: '700',
      marginBottom: 8,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: sizes.text.body,
      lineHeight: 22,
      marginBottom: 18,
    },
    loading: {
      color: colors.textSecondary,
      fontSize: sizes.text.sm,
      marginTop: 10,
    },
    emptyState: {
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.card,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    emptyText: {
      color: colors.textSecondary,
      textAlign: 'center',
    },
    grid: {
      gap: 14,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.card,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    image: {
      width: '100%',
      height: 220,
    },
    meta: {
      color: colors.accent2,
      fontSize: sizes.text.xs,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingRight: 12,
    },
    delete: { color: colors.error, fontSize: sizes.text.xs, fontWeight: '700' },
    error: { color: colors.error, fontSize: sizes.text.sm, marginBottom: 10 },
  })
