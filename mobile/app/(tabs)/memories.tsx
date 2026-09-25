import { useLocalSearchParams, useRouter } from 'expo-router'
import { Heart, Map, BookHeart, Clock3 } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import GallerySection from '@/components/memories/GallerySection'
import MemoryJournal from '@/components/memories/MemoryJournal'
import MemoryMapSection from '@/components/memories/MemoryMapSection'
import OurStorySection from '@/components/memories/OurStorySection'
import TimeCapsulesSection from '@/components/memories/TimeCapsulesSection'
import { useTheme } from '@/context/ThemeContext'
import type { ThemeColors } from '@/context/ThemeContext'
import { sizes } from '@/design-tokens'

type Section = 'memories' | 'gallery' | 'map' | 'story' | 'capsules'
const sections: { id: Section; label: string; Icon: typeof Heart }[] = [
  { id: 'memories', label: 'Memories', Icon: Heart },
  { id: 'gallery', label: 'Gallery', Icon: Heart },
  { id: 'map', label: 'Map', Icon: Map },
  { id: 'story', label: 'Our Story', Icon: BookHeart },
  { id: 'capsules', label: 'Time Capsules', Icon: Clock3 },
]

function isSection(value: unknown): value is Section {
  return sections.some((section) => section.id === value)
}

export default function MemoriesHub() {
  const { colors } = useTheme()
  const router = useRouter()
  const { section } = useLocalSearchParams<{ section?: string }>()
  const [activeSection, setActiveSection] = useState<Section>('memories')
  const styles = createStyles(colors)

  useEffect(() => {
    if (isSection(section)) setActiveSection(section)
  }, [section])

  const selectSection = (next: Section) => {
    setActiveSection(next)
    router.setParams({ section: next === 'memories' ? undefined : next })
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.nav}
      >
        {sections.map(({ id, label, Icon }) => (
          <TouchableOpacity
            key={id}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeSection === id }}
            onPress={() => selectSection(id)}
            style={[styles.navItem, activeSection === id && styles.navItemActive]}
          >
            <Icon color={activeSection === id ? colors.accent1 : colors.textSecondary} size={17} />
            <Text
              style={[
                styles.navText,
                { color: activeSection === id ? colors.accent1 : colors.textSecondary },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.content}>
        {activeSection === 'memories' ? <MemoryJournal /> : null}
        {activeSection === 'gallery' ? <GallerySection /> : null}
        {activeSection === 'map' ? <MemoryMapSection /> : null}
        {activeSection === 'story' ? <OurStorySection /> : null}
        {activeSection === 'capsules' ? <TimeCapsulesSection /> : null}
      </View>
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    nav: { gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
    navItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: sizes.radius.input,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    navItemActive: { backgroundColor: colors.surface },
    navText: { fontSize: sizes.text.xs, fontWeight: '600' },
    content: { flex: 1 },
  })
