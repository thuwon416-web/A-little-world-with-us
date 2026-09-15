import { useMemo, useState } from 'react'
import { Copy, RefreshCw, X } from 'lucide-react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { Modal } from '@/components/ui/Modal'
import { useTheme } from '@/context/ThemeContext'

export default function PasswordGenerator({ visible, onClose, onSelect }: { visible: boolean; onClose: () => void; onSelect: (value: string) => void }) {
  const { colors: themeColors } = useTheme()
  const colors = { ...themeColors, text: themeColors.textPrimary, muted: themeColors.textSecondary, border: themeColors.cardBorder, buttonBg: themeColors.surface }
  const [length, setLength] = useState(20)
  const [sets, setSets] = useState([true, true, true, true])
  const [exclude, setExclude] = useState(true)
  const [seed, setSeed] = useState(0)
  const password = useMemo(() => {
    const alphabets = [
      sets[0] ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : '',
      sets[1] ? 'abcdefghijkmnopqrstuvwxyz' : '',
      sets[2] ? (exclude ? '23456789' : '0123456789') : '',
      sets[3] ? '!@#$%^&*()-_=+' : '',
    ].join('') || 'abcdefghijkmnopqrstuvwxyz'
    return Array.from({ length }, (_, index) => alphabets[(index * 31 + seed * 17 + Math.floor(Math.random() * alphabets.length)) % alphabets.length]).join('')
  }, [exclude, length, seed, sets])
  const strength = length >= 20 && sets.filter(Boolean).length >= 3 ? 'Strong' : length >= 12 && sets.filter(Boolean).length >= 2 ? 'Medium' : 'Weak'
  return (
    <Modal visible={visible} onClose={onClose} title="Password generator">
      <Text style={[styles.password, { color: colors.text }]}>{password}</Text>
      <Text style={{ color: strength === 'Strong' ? colors.success : colors.accent2 }}>Strength: {strength}</Text>
      <Text style={[styles.label, { color: colors.muted }]}>Length: {length}</Text>
      <View style={styles.lengthRow}>{[8, 16, 24, 32, 48, 64].map((value) => <Pressable key={value} onPress={() => setLength(value)} style={[styles.lengthButton, { borderColor: colors.border, backgroundColor: value === length ? colors.buttonBg : colors.surface }]}><Text style={{ color: colors.text }}>{value}</Text></Pressable>)}</View>
      {['Uppercase', 'Lowercase', 'Numbers', 'Symbols'].map((label, index) => <Pressable key={label} onPress={() => setSets((current) => current.map((value, item) => item === index ? !value : value))} style={styles.option}><Text style={{ color: colors.text }}>{sets[index] ? '✓' : '○'} {label}</Text></Pressable>)}
      <Pressable onPress={() => setExclude((value) => !value)} style={styles.option}><Text style={{ color: colors.text }}>{exclude ? '✓' : '○'} Exclude ambiguous</Text></Pressable>
      <View style={styles.actions}><Pressable onPress={() => setSeed((value) => value + 1)} style={[styles.action, { borderColor: colors.border }]}><RefreshCw size={15} color={colors.text} /><Text style={{ color: colors.text }}>Regenerate</Text></Pressable><Pressable onPress={() => void navigator.clipboard?.writeText(password)} style={[styles.action, { borderColor: colors.border }]}><Copy size={15} color={colors.text} /><Text style={{ color: colors.text }}>Copy</Text></Pressable><Pressable onPress={() => { onSelect(password); onClose() }} style={[styles.action, { backgroundColor: colors.buttonBg }]}><Text style={{ color: colors.text }}>Use</Text></Pressable></View>
      <Pressable onPress={onClose} style={styles.close}><X size={16} color={colors.muted} /></Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  password: { backgroundColor: 'transparent', fontFamily: 'monospace', fontSize: 17, marginBottom: 10 },
  label: { marginTop: 18, marginBottom: 8 },
  lengthRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  lengthButton: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 7 },
  option: { paddingVertical: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 9 },
  close: { alignSelf: 'flex-end', marginTop: 12 },
})
