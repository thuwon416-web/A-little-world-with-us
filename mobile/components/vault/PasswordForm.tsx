import { Eye, EyeOff, KeyRound } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native'

import PasswordGenerator from './PasswordGenerator'

import { Modal } from '@/components/ui/Modal'
import { useTheme } from '@/context/ThemeContext'
import { encryptCredential } from '@/lib/vault-crypto'
import {
  createCredential,
  updateCredential,
  type VaultCredential,
} from '@/services/vault-credentials'

const categories = ['email', 'social', 'banking', 'shopping', 'work', 'streaming', 'other']

export default function PasswordForm({
  visible,
  onClose,
  onSaved,
  masterKey,
  credential,
  initialData,
}: {
  visible: boolean
  onClose: () => void
  onSaved: () => void
  masterKey: Uint8Array
  credential?: VaultCredential
  initialData?: Record<string, string>
}) {
  const { colors: themeColors } = useTheme()
  const colors = {
    ...themeColors,
    text: themeColors.textPrimary,
    muted: themeColors.textSecondary,
    border: themeColors.cardBorder,
    buttonBg: themeColors.surface,
  }
  const [label, setLabel] = useState(credential?.label ?? '')
  const [username, setUsername] = useState(initialData?.username ?? '')
  const [password, setPassword] = useState(initialData?.password ?? '')
  const [url, setUrl] = useState(credential?.websiteUrl ?? '')
  const [category, setCategory] = useState(credential?.category ?? 'other')
  const [notes, setNotes] = useState(initialData?.notes ?? '')
  const [shared, setShared] = useState(credential?.isShared ?? false)
  const [show, setShow] = useState(false)
  const [generator, setGenerator] = useState(false)
  const [saving, setSaving] = useState(false)
  const input = { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }
  const save = async () => {
    if (!label.trim() || !password) {
      Alert.alert('Missing details', 'Label and password are required.')
      return
    }
    setSaving(true)
    try {
      const encrypted = await encryptCredential(
        { title: label.trim(), username, password, url, notes },
        masterKey
      )
      const payload = {
        isShared: shared,
        encryptedPayload: encrypted.encryptedPayload,
        encryptionIv: encrypted.iv,
        encryptionVersion: 1,
        category,
        label: label.trim(),
        websiteUrl: url || null,
        keyVersion: 1,
      }
      if (credential) await updateCredential(credential.id, payload)
      else await createCredential(payload)
      onSaved()
    } catch (error) {
      Alert.alert('Unable to save', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setSaving(false)
    }
  }
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={credential ? 'Edit password' : 'Add password'}
    >
      {[
        ['Label', label, setLabel, 'Gmail'],
        ['Username', username, setUsername, 'name@example.com'],
        ['Website URL', url, setUrl, 'https://'],
        ['Notes', notes, setNotes, 'Optional notes'],
      ].map(([title, value, setter, placeholder]) => (
        <View key={title as string} style={styles.field}>
          <Text style={{ color: colors.muted }}>{title as string}</Text>
          <TextInput
            value={value as string}
            onChangeText={setter as (value: string) => void}
            placeholder={placeholder as string}
            placeholderTextColor={colors.muted}
            style={[styles.input, input]}
            multiline={title === 'Notes'}
          />
        </View>
      ))}
      <Text style={{ color: colors.muted }}>Password</Text>
      <View style={styles.passwordRow}>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!show}
          style={[styles.input, input, { flex: 1 }]}
        />
        <Pressable onPress={() => setShow((value) => !value)}>
          <>
            {show ? (
              <EyeOff size={19} color={colors.muted} />
            ) : (
              <Eye size={19} color={colors.muted} />
            )}
          </>
        </Pressable>
        <Pressable onPress={() => setGenerator(true)}>
          <KeyRound size={19} color={colors.accent1} />
        </Pressable>
      </View>
      <Text style={[styles.label, { color: colors.muted }]}>Category</Text>
      <View style={styles.categoryRow}>
        {categories.map((item) => (
          <Pressable
            key={item}
            onPress={() => setCategory(item)}
            style={[
              styles.category,
              {
                borderColor: colors.border,
                backgroundColor: category === item ? colors.buttonBg : colors.surface,
              },
            ]}
          >
            <Text style={{ color: colors.text }}>{item}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.switchRow}>
        <Text style={{ color: colors.text }}>Share with my partner</Text>
        <Switch
          value={shared}
          onValueChange={setShared}
          trackColor={{ false: colors.border, true: colors.accent1 }}
        />
      </View>
      <Pressable
        onPress={() => void save()}
        disabled={saving}
        style={[styles.save, { backgroundColor: colors.buttonBg }]}
      >
        <Text style={{ color: colors.text }}>{saving ? 'Saving…' : 'Save password'}</Text>
      </Pressable>
      <PasswordGenerator
        visible={generator}
        onClose={() => setGenerator(false)}
        onSelect={setPassword}
      />
    </Modal>
  )
}

const styles = StyleSheet.create({
  field: { marginBottom: 10 },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, marginTop: 5 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { marginTop: 10, marginBottom: 7 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  category: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 7 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  save: { alignItems: 'center', borderRadius: 12, padding: 12 },
})
