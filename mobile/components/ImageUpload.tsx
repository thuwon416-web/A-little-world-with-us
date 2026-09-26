import * as Crypto from 'expo-crypto'
import * as ImagePicker from 'expo-image-picker'
import { useState } from 'react'
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/lib/auth'
import { downloadDecryptAndCache, encryptMedia } from '@/lib/mediaEncryption'
import { supabase } from '@/lib/supabase'

export default function ImageUpload({
  onUpload,
  folder = 'gallery',
  coupleId,
}: {
  onUpload?: (image: {
    id: string
    path: string
    ownerId: string
    mimeType: string
    url: string
    name: string
    created_at: string
  }) => void
  folder?: string
  coupleId: string
}) {
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()

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
      if (!user?.id) throw new Error('Please wait for sign-in to finish.')
      const path = `${user.id}/${Date.now()}-${Crypto.randomUUID()}.jpg`

      const encryptedData = await encryptMedia(new Uint8Array(await blob.arrayBuffer()), coupleId)
      const { data, error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(path, encryptedData, {
          contentType: 'application/octet-stream',
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      const storedPath = data?.path ?? path
      const mimeType = 'image/jpeg'
      const url = await downloadDecryptAndCache(coupleId, 'gallery', storedPath, mimeType)

      const result = {
        id: data?.id ?? path,
        path: data?.path ?? path,
        ownerId: user.id,
        mimeType,
        url,
        name: storedPath.split('/').pop() ?? 'gallery-image',
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

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: 18,
      marginBottom: 18,
    },
    label: {
      color: colors.accent2,
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
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    selectButtonText: {
      color: colors.textPrimary,
      fontWeight: '700',
    },
    preview: {
      width: '100%',
      height: 220,
      borderRadius: 18,
      marginBottom: 14,
    },
    uploadButton: {
      backgroundColor: colors.accent2,
      borderRadius: 999,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 12,
    },
    uploadButtonDisabled: {
      opacity: 0.5,
    },
    uploadButtonText: {
      color: colors.background,
      fontWeight: '700',
      fontSize: 14,
    },
    error: {
      color: colors.error,
      fontSize: 12,
      marginTop: 8,
    },
  })
