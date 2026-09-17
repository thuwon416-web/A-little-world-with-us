import * as DocumentPicker from 'expo-document-picker'
import { FileUp, X } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { useTheme } from '@/context/ThemeContext'
import type { ChatAttachment } from './chat-types'

type Props = {
  visible: boolean
  onClose: () => void
  onFileSelect: (file: ChatAttachment) => Promise<void>
}

export function FileUpload({ visible, onClose, onFileSelect }: Props) {
  const { colors } = useTheme()
  const [file, setFile] = useState<ChatAttachment | null>(null)
  const [sending, setSending] = useState(false)
  const choose = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
    })
    if (result.canceled || !result.assets[0]) return
    const asset = result.assets[0]
    setFile({
      uri: asset.uri,
      name: asset.name,
      mimeType: (asset.mimeType || 'application/octet-stream').toLowerCase(),
      size: asset.size,
    })
  }
  const send = async () => {
    if (!file) return
    setSending(true)
    try {
      await onFileSelect(file)
      setFile(null)
      onClose()
    } catch (error) {
      Alert.alert('File failed', error instanceof Error ? error.message : 'Unable to send file.')
    } finally {
      setSending(false)
    }
  }
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Send file</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={colors.textPrimary} size={22} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.dropzone, { borderColor: `${colors.accent1}66` }]}
            onPress={() => void choose()}
          >
            <FileUp color={colors.accent1} size={38} />
            <Text style={[styles.secondary, { color: colors.textSecondary }]}>{file?.name || 'Choose a file'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.send, { backgroundColor: colors.accent1 }, !file && styles.disabled]}
            disabled={!file || sending}
            onPress={() => void send()}
          >
            <Text style={[styles.sendText, { color: colors.background }]}>{sending ? 'Sending...' : 'Send file'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#0008', justifyContent: 'center', padding: 20 },
  card: { borderRadius: 24, padding: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '700' },
  dropzone: {
    height: 160,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: { marginTop: 12, textAlign: 'center' },
  send: {
    marginTop: 16,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  sendText: { fontWeight: '700' },
  disabled: { opacity: 0.45 },
})
