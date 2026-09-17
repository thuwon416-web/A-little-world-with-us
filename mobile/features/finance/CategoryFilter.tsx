import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native'

import { EXPENSE_CATEGORIES } from './finance-constants'
import { useTheme } from '@/context/ThemeContext'

type CategoryFilterProps = {
  active: string
  onChange: (value: string) => void
}

export default function CategoryFilter({ active, onChange }: CategoryFilterProps) {
  const { colors } = useTheme()
  const styles = createStyles(colors)
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {['all', ...EXPENSE_CATEGORIES.map((category) => category.value)].map((value) => {
        const label = value === 'all'
          ? 'All'
          : EXPENSE_CATEGORIES.find((category) => category.value === value)?.label ?? value
        const selected = active === value
        return (
          <TouchableOpacity key={value} onPress={() => onChange(value)} style={[styles.pill, selected ? styles.active : styles.inactive]}>
            <Text style={selected ? styles.activeText : styles.inactiveText}>{label}</Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: { gap: 8, paddingVertical: 2 },
  pill: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  active: { backgroundColor: colors.accent1 },
  inactive: { borderWidth: 1, borderColor: `${colors.accent1}4d`, backgroundColor: colors.surface },
  activeText: { color: colors.background, fontWeight: '700' },
  inactiveText: { color: colors.textSecondary },
})
