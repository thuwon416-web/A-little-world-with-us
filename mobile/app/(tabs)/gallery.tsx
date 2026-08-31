import { useEffect, useState } from 'react'
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import ImageUpload from '@/components/ImageUpload'
import { supabase } from '@/lib/supabase'

type GalleryItem = {
  id: string
  path: string
  url: string
  name: string
  created_at: string
}

export default function GalleryScreen() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadGallery = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.storage.from('gallery').list('', { limit: 100 })
      if (error) {
        throw error
      }

      const galleryItems = (data ?? [])
        .filter((item) => item.name && !item.metadata?.isFolder)
        .map((item) => {
          const { data: publicData } = supabase.storage.from('gallery').getPublicUrl(item.name)
          return {
            id: item.id ?? item.name,
            path: item.name,
            url: publicData.publicUrl,
            name: item.name,
            created_at: item.created_at ?? new Date().toISOString(),
          }
        })

      setItems(galleryItems)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadGallery()
  }, [])

  const handleUpload = (image: GalleryItem) => {
    setItems((current) => [image, ...current])
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>Gallery</Text>
      <Text style={styles.title}>Shared moments</Text>
      <Text style={styles.subtitle}>Save little snapshots of your story.</Text>

      <ImageUpload onUpload={handleUpload} />

      {loading ? (
        <Text style={styles.loading}>Loading gallery…</Text>
      ) : items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No photos yet.</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {items.map((item) => (
            <View key={item.id} style={styles.card}>
              <Image source={{ uri: item.url }} style={styles.image} resizeMode="cover" />
              <Text style={styles.meta}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0f0f12',
    paddingTop: 72,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  eyebrow: {
    color: '#d9bfd7',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: '#f3f0f5',
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#c4c4ce',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  loading: {
    color: '#c4c4ce',
    fontSize: 14,
    marginTop: 10,
  },
  emptyState: {
    backgroundColor: '#171b22',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2d35',
  },
  emptyText: {
    color: '#c4c4ce',
    textAlign: 'center',
  },
  grid: {
    gap: 14,
  },
  card: {
    backgroundColor: '#171b22',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2d35',
  },
  image: {
    width: '100%',
    height: 220,
  },
  meta: {
    color: '#d9bfd7',
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
})
