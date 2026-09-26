import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { Download, HeartPulse, Plus, RefreshCw, Upload } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Alert, FlatList, Pressable, Share, StyleSheet, Text, View } from 'react-native'

import PasswordCard from './PasswordCard'
import PasswordForm from './PasswordForm'
import PasswordHealth from './PasswordHealth'

import { useTheme } from '@/context/ThemeContext'
import { exportVault } from '@/lib/vault-export'
import { importVault } from '@/lib/vault-import'
import {
  deleteCredential,
  getCredentials,
  type VaultCredential,
} from '@/services/vault-credentials'

export default function PasswordList({ masterKey }: { masterKey: Uint8Array }) {
  const { colors: themeColors } = useTheme()
  const colors = {
    ...themeColors,
    text: themeColors.textPrimary,
    muted: themeColors.textSecondary,
    danger: themeColors.error,
  }
  const [items, setItems] = useState<VaultCredential[]>([])
  const [form, setForm] = useState<{
    item?: VaultCredential
    data?: Record<string, string>
  } | null>(null)
  const [error, setError] = useState('')
  const [healthOpen, setHealthOpen] = useState(false)
  const [highlighted, setHighlighted] = useState<string[]>([])
  const load = async () => {
    try {
      setItems(await getCredentials())
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load passwords.')
    }
  }
  useEffect(() => {
    void load()
  }, [])
  const remove = async (id: string) => {
    try {
      await deleteCredential(id)
      await load()
    } catch (cause) {
      Alert.alert('Unable to delete', cause instanceof Error ? cause.message : 'Please try again.')
    }
  }
  const exportFile = async () => {
    const content = await exportVault(masterKey, items)
    const uri = `${FileSystem.cacheDirectory}vault-${Date.now()}.vault`
    await FileSystem.writeAsStringAsync(uri, content)
    await Share.share({ url: uri, message: content })
  }
  const importFile = async () => {
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/plain'],
      copyToCacheDirectory: true,
    })
    if (picked.canceled) return
    try {
      const content = await FileSystem.readAsStringAsync(picked.assets[0].uri)
      const result = await importVault(content, masterKey)
      Alert.alert(
        'Import complete',
        `Imported ${result.imported}; skipped ${result.skipped}.${result.errors.length ? ` ${result.errors.join(' ')}` : ''}`
      )
      await load()
    } catch (cause) {
      Alert.alert(
        'Unable to import',
        cause instanceof Error ? cause.message : 'Please select a valid Vault export.'
      )
    }
  }
  return (
    <View>
      <View style={styles.heading}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Passwords</Text>
          <Text style={{ color: colors.muted }}>Encrypted credentials for the two of you.</Text>
        </View>
        <View style={styles.headingActions}>
          <Pressable onPress={() => setHealthOpen((value) => !value)}>
            <HeartPulse size={18} color={colors.accent1} />
          </Pressable>
          <Pressable onPress={() => void exportFile()}>
            <Download size={18} color={colors.muted} />
          </Pressable>
          <Pressable onPress={() => void importFile()}>
            <Upload size={18} color={colors.muted} />
          </Pressable>
          <Pressable onPress={() => void load()}>
            <RefreshCw size={18} color={colors.muted} />
          </Pressable>
          <Pressable onPress={() => setForm({})}>
            <Plus size={20} color={colors.accent1} />
          </Pressable>
        </View>
      </View>
      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
      {healthOpen ? (
        <PasswordHealth credentials={items} masterKey={masterKey} onFocus={setHighlighted} />
      ) : null}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.muted }]}>No passwords yet</Text>
        }
        renderItem={({ item }) => (
          <PasswordCard
            credential={item}
            masterKey={masterKey}
            highlighted={highlighted.includes(item.id)}
            onEdit={(credential, data) => setForm({ item: credential, data })}
            onDelete={(id) => void remove(id)}
          />
        )}
      />
      {form ? (
        <PasswordForm
          visible
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null)
            void load()
          }}
          masterKey={masterKey}
          credential={form.item}
          initialData={form.data}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: { fontSize: 23, fontWeight: '700' },
  headingActions: { flexDirection: 'row', gap: 18 },
  empty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 30,
    textAlign: 'center',
  },
})
