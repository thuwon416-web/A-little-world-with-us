import * as ImagePicker from 'expo-image-picker'
import { useState } from 'react'
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native'

import { supabase } from '@/lib/supabase'

export default function ImageUpload({
  onUpload,
  folder = 'gallery',
}: {
  onUpload?: (image: {
    id: string
    path: string
    url: string
    name: string
    created_at: string
  }) => void
  folder?: string
}) {
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos to upload them.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    })

    if (result.canceled || !result.assets?.[0]) {
      return
    }

    setPreview(result.assets[0].uri)
    setError('')
  }

  const handleUpload = async () => {
    if (!preview) {
      setError('Choose an image first.')
      return
    }

    try {
      setIsUploading(true)
      setError('')

      const response = await fetch(preview)
      const blob = await response.blob()
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`

      const { data, error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(path, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      const { data: publicData } = supabase.storage.from('gallery').getPublicUrl(data?.path ?? path)

      const result = {
        id: data?.id ?? path,
        path: data?.path ?? path,
        url: publicData.publicUrl,
        name: path.split('/').pop() ?? 'gallery-image',
        created_at: new Date().toISOString(),
      }

      onUpload?.(result)
      setPreview(null)
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'Upload failed.'
      setError(message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Shared memory</Text>

      {preview ? (
        <Image source={{ uri: preview }} style={styles.preview} resizeMode="cover" />
      ) : (
        <Pressable style={styles.selectButton} onPress={() => void handlePickImage()}>
          <Text style={styles.selectButtonText}>Choose photo</Text>
        </Pressable>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.uploadButton, (!preview || isUploading) && styles.uploadButtonDisabled]}
        onPress={() => void handleUpload()}
        disabled={!preview || isUploading}
      >
        <Text style={styles.uploadButtonText}>
          {isUploading ? 'Uploading...' : 'Upload to gallery'}
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#171b22',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2a2d35',
    padding: 18,
    marginBottom: 18,
  },
  label: {
    color: '#d9bfd7',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  selectButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    paddingVertical: 18,
    backgroundColor: '#1f2530',
    borderWidth: 1,
    borderColor: '#3d4556',
  },
  selectButtonText: {
    color: '#f3f0f5',
    fontWeight: '700',
  },
  preview: {
    width: '100%',
    height: 220,
    borderRadius: 18,
    marginBottom: 14,
  },
  uploadButton: {
    backgroundColor: '#d8b9c8',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonText: {
    color: '#0f0f12',
    fontWeight: '700',
    fontSize: 14,
  },
  error: {
    color: '#ffb4c0',
    fontSize: 12,
    marginTop: 8,
  },
})
