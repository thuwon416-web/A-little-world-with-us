import { useEffect, useState } from 'react'
import { Copy, Edit3, Eye, EyeOff, Globe, Trash2 } from 'lucide-react-native'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'

import { Card } from '@/components/ui/Card'
import { useTheme } from '@/context/ThemeContext'
import { decryptCredential } from '@/lib/vault-crypto'
import type { VaultCredential } from '@/services/vault-credentials'

export default function PasswordCard({ credential, masterKey, onEdit, onDelete, highlighted }: { credential: VaultCredential; masterKey: Uint8Array; onEdit: (item: VaultCredential, data: Record<string, string>) => void; onDelete: (id: string) => void; highlighted?: boolean }) {
  const { colors: themeColors } = useTheme()
  const colors = { ...themeColors, text: themeColors.textPrimary, muted: themeColors.textSecondary, border: themeColors.cardBorder, danger: themeColors.error }
  const [data, setData] = useState<Record<string, string> | null>(null)
  const [revealed, setRevealed] = useState(false)
  useEffect(() => { setData(null); setRevealed(false) }, [credential.id, masterKey])
  const reveal = async () => {
    try { if (!data) setData(await decryptCredential(credential.encryptedPayload, credential.encryptionIv, masterKey) as Record<string, string>); setRevealed(true); setTimeout(() => setRevealed(false), 30_000) }
    catch (error) { Alert.alert('Unable to decrypt', error instanceof Error ? error.message : 'Please unlock again.') }
  }
  const copy = async (value: string) => { await navigator.clipboard?.writeText(value); Alert.alert('Copied', 'Copied to clipboard.') }
  return <Card style={[styles.card, highlighted && { borderColor: colors.warning, borderWidth: 2 }]}><View style={styles.header}><View style={styles.titleRow}><Globe size={19} color={colors.accent1} /><View><Text style={{ color: colors.text, fontWeight: '700' }}>{credential.label}</Text><Text style={{ color: colors.muted }}>{credential.category}{credential.isShared ? ' · Shared' : ''}</Text></View></View><Pressable onPress={() => void reveal()}><>{revealed ? <EyeOff size={19} color={colors.muted} /> : <Eye size={19} color={colors.muted} />}</></Pressable></View>
    {revealed && data ? <View style={[styles.details, { borderTopColor: colors.border }]}><Text style={{ color: colors.text }}>Username: {data.username || '—'} <Copy size={14} color={colors.accent1} onPress={() => void copy(data.username || '')} /></Text><Text style={{ color: colors.text }}>Password: <Text style={styles.mask}>{data.password || '—'}</Text> <Copy size={14} color={colors.accent1} onPress={() => void copy(data.password || '')} /></Text>{data.notes ? <Text style={{ color: colors.muted }}>{data.notes}</Text> : null}</View> : null}
    <View style={styles.actions}><Pressable onPress={async () => { const current = data ?? await decryptCredential(credential.encryptedPayload, credential.encryptionIv, masterKey) as Record<string, string>; onEdit(credential, current) }}><Edit3 size={17} color={colors.muted} /></Pressable><Pressable onPress={() => Alert.alert('Delete password?', 'This cannot be undone.', [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive', onPress: () => onDelete(credential.id) }])}><Trash2 size={17} color={colors.danger} /></Pressable></View>
  </Card>
}

const styles = StyleSheet.create({
  card: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  details: { borderTopWidth: 1, marginTop: 14, paddingTop: 12, gap: 8 },
  mask: { fontFamily: 'monospace' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 18, marginTop: 14 },
})
