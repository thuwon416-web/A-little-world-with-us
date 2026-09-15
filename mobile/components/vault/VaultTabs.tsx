import { KeyRound, Mail } from 'lucide-react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '@/context/ThemeContext'

export type VaultTab = 'letters' | 'passwords'

export default function VaultTabs({ tab, onChange }: { tab: VaultTab; onChange: (tab: VaultTab) => void }) {
  const { colors: themeColors } = useTheme()
  const colors = { ...themeColors, text: themeColors.textPrimary, muted: themeColors.textSecondary, buttonBg: themeColors.surface }
  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {[
        { id: 'letters' as const, label: 'Letters', Icon: Mail },
        { id: 'passwords' as const, label: 'Passwords', Icon: KeyRound },
      ].map(({ id, label, Icon }) => (
        <Pressable key={id} onPress={() => onChange(id)} style={[styles.tab, tab === id && { backgroundColor: colors.buttonBg }]} accessibilityRole="tab" accessibilityState={{ selected: tab === id }}>
          <Icon size={16} color={tab === id ? colors.text : colors.muted} />
          <Text style={{ color: tab === id ? colors.text : colors.muted }}>{label}</Text>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', borderRadius: 14, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 11, paddingVertical: 11 },
})
