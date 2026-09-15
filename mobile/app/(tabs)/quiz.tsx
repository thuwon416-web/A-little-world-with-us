import { useLocalSearchParams, router } from 'expo-router'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { QuizEngine } from '@/components/learning/QuizEngine'
import { useTheme } from '@/context/ThemeContext'
import type { KoreanLevel, QuizType } from '@/types/korean'

export default function QuizScreen() {
  const { colors } = useTheme()
  const params = useLocalSearchParams<{ level?: string; quizType?: string }>()
  const parsedLevel = Number(params.level ?? 1)
  const level = ([1, 2, 3, 4, 5, 6, 7] as number[]).includes(parsedLevel)
    ? parsedLevel as KoreanLevel
    : 1
  const requestedType = params.quizType
  const quizType: QuizType =
    requestedType === 'fill_blank' ||
    requestedType === 'matching' ||
    requestedType === 'listening' ||
    requestedType === 'typing'
      ? requestedType
      : 'multiple_choice'

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: colors.accent1 }]}>LEVEL {level}</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Korean Quiz</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Practice together and build your Korean confidence.
        </Text>
      </View>
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <QuizEngine
          level={level}
          quizType={quizType}
          questionCount={10}
          onComplete={() => router.back()}
        />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, paddingTop: 72, paddingBottom: 40, gap: 20 },
  header: { gap: 6 },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  title: { fontSize: 30, fontWeight: '700' },
  subtitle: { fontSize: 14, lineHeight: 21 },
  card: { borderWidth: 1, borderRadius: 22, padding: 18 },
})
