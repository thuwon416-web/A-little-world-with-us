import * as Crypto from 'expo-crypto'
import { Copy, RefreshCw, X } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { Modal } from '@/components/ui/Modal'
import { useTheme } from '@/context/ThemeContext'

export default function PasswordGenerator({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean
  onClose: () => void
  onSelect: (value: string) => void
}) {
  const { colors: themeColors } = useTheme()
  const colors = {
    ...themeColors,
    text: themeColors.textPrimary,
    muted: themeColors.textSecondary,
    border: themeColors.cardBorder,
    buttonBg: themeColors.surface,
  }
  const [length, setLength] = useState(20)
  const [sets, setSets] = useState([true, true, true, true])
  const [exclude, setExclude] = useState(true)
  const [seed, setSeed] = useState(0)
  const [password, setPassword] = useState('')
  const [generationError, setGenerationError] = useState('')

  useEffect(() => {
    let active = true
    const alphabets =
      [
        sets[0] ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : '',
        sets[1] ? 'abcdefghijkmnopqrstuvwxyz' : '',
        sets[2] ? (exclude ? '23456789' : '0123456789') : '',
        sets[3] ? '!@#$%^&*()-_=+' : '',
      ].join('') || 'abcdefghijkmnopqrstuvwxyz'

    const generate = async () => {
      const indices: number[] = []
      const limit = 256 - (256 % alphabets.length)
      while (indices.length < length) {
        const bytes = await Crypto.getRandomBytesAsync(Math.max(16, (length - indices.length) * 2))
        for (const byte of bytes) {
          if (byte < limit) indices.push(byte % alphabets.length)
          if (indices.length === length) break
        }
      }
      if (active) {
        setPassword(indices.map((index) => alphabets[index]).join(''))
        setGenerationError('')
      }
    }

    setPassword('')
    setGenerationError('')
    void generate().catch((caught: unknown) => {
      if (active) {
        setGenerationError(caught instanceof Error ? caught.message : 'Unable to generate a password securely.')
      }
    })

    return () => {
      active = false
    }
  }, [exclude, length, seed, sets])
  const strength =
    length >= 20 && sets.filter(Boolean).length >= 3
      ? 'Strong'
      : length >= 12 && sets.filter(Boolean).length >= 2
        ? 'Medium'
        : 'Weak'
  return (
    <Modal visible={visible} onClose={onClose} title="Password generator">
      <Text style={[styles.password, { color: colors.text }]}>{password}</Text>
      {generationError ? <Text style={{ color: colors.error }}>{generationError}</Text> : null}
      <Text style={{ color: strength === 'Strong' ? colors.success : colors.accent2 }}>
        Strength: {strength}
      </Text>
      <Text style={[styles.label, { color: colors.muted }]}>Length: {length}</Text>
      <View style={styles.lengthRow}>
        {[8, 16, 24, 32, 48, 64].map((value) => (
          <Pressable
            key={value}
            onPress={() => setLength(value)}
            style={[
              styles.lengthButton,
              {
                borderColor: colors.border,
                backgroundColor: value === length ? colors.buttonBg : colors.surface,
              },
            ]}
          >
            <Text style={{ color: colors.text }}>{value}</Text>
          </Pressable>
        ))}
      </View>
      {['Uppercase', 'Lowercase', 'Numbers', 'Symbols'].map((label, index) => (
        <Pressable
          key={label}
          onPress={() =>
            setSets((current) => current.map((value, item) => (item === index ? !value : value)))
          }
          style={styles.option}
        >
          <Text style={{ color: colors.text }}>
            {sets[index] ? '✓' : '○'} {label}
          </Text>
        </Pressable>
      ))}
      <Pressable onPress={() => setExclude((value) => !value)} style={styles.option}>
        <Text style={{ color: colors.text }}>{exclude ? '✓' : '○'} Exclude ambiguous</Text>
      </Pressable>
      <View style={styles.actions}>
        <Pressable
          onPress={() => setSeed((value) => value + 1)}
          style={[styles.action, { borderColor: colors.border }]}
        >
          <RefreshCw size={15} color={colors.text} />
          <Text style={{ color: colors.text }}>Regenerate</Text>
        </Pressable>
        <Pressable
          onPress={() => void navigator.clipboard?.writeText(password)}
          disabled={!password}
          style={[styles.action, { borderColor: colors.border }]}
        >
          <Copy size={15} color={colors.text} />
          <Text style={{ color: colors.text }}>Copy</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            if (!password) return
            onSelect(password)
            onClose()
          }}
          disabled={!password}
          style={[styles.action, { backgroundColor: colors.buttonBg }]}
        >
          <Text style={{ color: colors.text }}>Use</Text>
        </Pressable>
      </View>
      <Pressable onPress={onClose} style={styles.close}>
        <X size={16} color={colors.muted} />
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  password: {
    backgroundColor: 'transparent',
    fontFamily: 'monospace',
    fontSize: 17,
    marginBottom: 10,
  },
  label: { marginTop: 18, marginBottom: 8 },
  lengthRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  lengthButton: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 7 },
  option: { paddingVertical: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  close: { alignSelf: 'flex-end', marginTop: 12 },
})
