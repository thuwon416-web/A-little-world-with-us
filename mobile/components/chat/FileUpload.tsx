import * as DocumentPicker from 'expo-document-picker'
import { FileUp, X } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import type { ChatAttachment } from './chat-types'

type Props = { visible: boolean; onClose: () => void; onFileSelect: (file: ChatAttachment) => Promise<void> }

export function FileUpload({ visible, onClose, onFileSelect }: Props) {
  const [file, setFile] = useState<ChatAttachment | null>(null)
  const [sending, setSending] = useState(false)
  const choose = async () => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false })
    if (result.canceled || !result.assets[0]) return
    const asset = result.assets[0]
    setFile({ uri: asset.uri, name: asset.name, mimeType: (asset.mimeType || 'application/octet-stream').toLowerCase(), size: asset.size })
  }
  const send = async () => {
    if (!file) return
    setSending(true)
    try { await onFileSelect(file); setFile(null); onClose() }
    catch (error) { Alert.alert('File failed', error instanceof Error ? error.message : 'Unable to send file.') }
    finally { setSending(false) }
  }
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><View style={styles.overlay}><View style={styles.card}>
    <View style={styles.header}><Text style={styles.title}>Send file</Text><TouchableOpacity onPress={onClose}><X color="#f3f0f5" size={22} /></TouchableOpacity></View>
    <TouchableOpacity style={styles.dropzone} onPress={() => void choose()}><FileUp color="#b88ae5" size={38} /><Text style={styles.secondary}>{file?.name || 'Choose a file'}</Text></TouchableOpacity>
    <TouchableOpacity style={[styles.send, !file && styles.disabled]} disabled={!file || sending} onPress={() => void send()}><Text style={styles.sendText}>{sending ? 'Sending...' : 'Send file'}</Text></TouchableOpacity>
  </View></View></Modal>
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#0008', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#171b22', borderRadius: 24, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { color: '#f3f0f5', fontSize: 20, fontWeight: '700' },
  dropzone: { height: 160, borderWidth: 2, borderStyle: 'dashed', borderColor: '#b88ae566', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  secondary: { color: '#aaa7b2', marginTop: 12, textAlign: 'center' },
  send: { marginTop: 16, backgroundColor: '#b88ae5', borderRadius: 14, padding: 14, alignItems: 'center' },
  sendText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.45 },
})
