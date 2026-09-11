import * as ImagePicker from 'expo-image-picker'
import { Image as ImageIcon, Send, X } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import type { ChatAttachment } from './chat-types'

type Props = {
  visible: boolean
  onClose: () => void
  onPhotoSelect: (photo: ChatAttachment) => Promise<void>
}

export function PhotoShare({ visible, onClose, onPhotoSelect }: Props) {
  const [photo, setPhoto] = useState<ChatAttachment | null>(null)
  const [sending, setSending] = useState(false)

  const choosePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to share an image.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    })
    if (result.canceled || !result.assets[0]) return
    const asset = result.assets[0]
    setPhoto({
      uri: asset.uri,
      name: asset.fileName || `photo-${Date.now()}.jpg`,
      mimeType: asset.mimeType || 'image/jpeg',
      size: asset.fileSize,
    })
  }

  const send = async () => {
    if (!photo) return
    setSending(true)
    try {
      await onPhotoSelect(photo)
      setPhoto(null)
      onClose()
    } catch (error) {
      Alert.alert('Photo failed', error instanceof Error ? error.message : 'Unable to send photo.')
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Share photo</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close photo picker">
              <X color="#f3f0f5" size={22} />
            </TouchableOpacity>
          </View>
          {photo ? (
            <View>
              <Image source={{ uri: photo.uri }} style={styles.preview} />
              <TouchableOpacity style={styles.clear} onPress={() => setPhoto(null)} accessibilityLabel="Remove selected photo">
                <X color="#fff" size={18} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.dropzone} onPress={() => void choosePhoto()}>
              <ImageIcon color="#b88ae5" size={42} />
              <Text style={styles.secondary}>Choose a photo</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.send, !photo && styles.disabled]} disabled={!photo || sending} onPress={() => void send()}>
            <Send color="#fff" size={18} />
            <Text style={styles.sendText}>{sending ? 'Sending...' : 'Send photo'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#0008', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#171b22', borderRadius: 24, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { color: '#f3f0f5', fontSize: 20, fontWeight: '700' },
  secondary: { color: '#aaa7b2', marginTop: 12 },
  dropzone: { height: 220, borderWidth: 2, borderStyle: 'dashed', borderColor: '#b88ae566', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  preview: { width: '100%', height: 260, borderRadius: 16 },
  clear: { position: 'absolute', right: 10, top: 10, backgroundColor: '#0009', borderRadius: 20, padding: 8 },
  send: { marginTop: 16, backgroundColor: '#b88ae5', borderRadius: 14, padding: 14, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  sendText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.45 },
})
