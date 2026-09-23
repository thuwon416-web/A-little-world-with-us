import { router } from 'expo-router'
import { BookOpen, Check, ChevronDown, ChevronUp, Languages, Volume2 } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme, type ThemeColors } from '@/context/ThemeContext'
import { KOREAN_LESSONS } from '@/data/korean-lessons'
import { KOREAN_VOCAB } from '@/data/korean-vocab'
import { sizes, type Sizes } from '@/design-tokens'
import { useTranslation } from '@/i18n/useTranslation'
import { useAuth } from '@/lib/auth'
import { isTTSSupported, speakKorean, stopSpeaking } from '@/lib/tts'
import { getProgress } from '@/services/korean'
import type { KoreanLevel, KoreanProgress, KoreanVocab } from '@/types/korean'

const levels: KoreanLevel[] = [1, 2, 3, 4, 5, 6, 7]

export default function LearningScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { t } = useTranslation()
  const styles = useMemo(() => createStyles(colors, sizes), [colors])
  const [selectedLevel, setSelectedLevel] = useState<KoreanLevel>(1)
  const [openLessonId, setOpenLessonId] = useState<string | null>(null)
  const [progress, setProgress] = useState<KoreanProgress[]>([])
  const [loadingProgress, setLoadingProgress] = useState(false)
  const [speakingVocabId, setSpeakingVocabId] = useState<string | null>(null)
  const ttsSupported = isTTSSupported()

  useEffect(() => () => stopSpeaking(), [])

  useEffect(() => {
    if (!user) return
    let active = true
    setLoadingProgress(true)
    void getProgress(user.id)
      .then((records) => {
        if (active) setProgress(records)
      })
      .catch(() => {
        if (active) setProgress([])
      })
      .finally(() => {
        if (active) setLoadingProgress(false)
      })

    return () => {
      active = false
    }
  }, [user])

  const lessons = useMemo(
    () => KOREAN_LESSONS.filter((lesson) => lesson.level === selectedLevel),
    [selectedLevel]
  )
  const levelVocab = useMemo(
    () => KOREAN_VOCAB.filter((vocab) => vocab.level === selectedLevel),
    [selectedLevel]
  )
  const masteredIds = useMemo(
    () => new Set(progress.filter((item) => item.masteryLevel >= 5).map((item) => item.vocabId)),
    [progress]
  )

  const getLessonVocab = (lessonId: string): KoreanVocab[] =>
    KOREAN_VOCAB.filter((vocab) => vocab.lessonId === lessonId)

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.headerIcon,
            { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
          ]}
        >
          <Languages size={28} color={colors.accent1} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Korean Tutor</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Learn Korean together, one step at a time.
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.progressCard,
          { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
        ]}
      >
        <View style={styles.progressCopy}>
          <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
            {loadingProgress ? 'Loading progress' : 'Your progress'}
          </Text>
          <Text style={[styles.progressValue, { color: colors.textPrimary }]}>
            {masteredIds.size} / {KOREAN_VOCAB.length} words mastered
          </Text>
        </View>
        {loadingProgress ? (
          <ActivityIndicator color={colors.accent1} />
        ) : (
          <Check size={22} color={colors.success} />
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.levelTabs}
        accessibilityLabel="Korean learning levels"
      >
        {levels.map((level) => {
          const selected = selectedLevel === level
          return (
            <TouchableOpacity
              key={level}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => {
                setSelectedLevel(level)
                setOpenLessonId(null)
              }}
              style={[
                styles.levelTab,
                {
                  backgroundColor: selected ? colors.accent1 : colors.cardBg,
                  borderColor: selected ? colors.accent1 : colors.cardBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.levelTabText,
                  { color: selected ? colors.background : colors.textSecondary },
                ]}
              >
                Level {level}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      <View style={styles.sectionHeading}>
        <View style={styles.sectionTitleRow}>
          <BookOpen size={22} color={colors.accent1} />
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Level {selectedLevel}
          </Text>
        </View>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          {levelVocab.length} words and phrases to explore
        </Text>
        {levelVocab.length > 0 && (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() =>
              router.push(`/(tabs)/quiz?level=${selectedLevel}&quizType=multiple_choice`)
            }
            style={[styles.quizButton, { backgroundColor: colors.accent1 }]}
          >
            <Text style={[styles.quizButtonText, { color: colors.background }]}>Start Quiz</Text>
          </TouchableOpacity>
        )}
      </View>

      {lessons.length > 0 ? (
        lessons.map((lesson) => {
          const lessonVocab = getLessonVocab(lesson.id)
          const isOpen = openLessonId === lesson.id
          const mastered = lessonVocab.filter((vocab) => masteredIds.has(vocab.id)).length

          return (
            <View
              key={lesson.id}
              style={[
                styles.lessonCard,
                { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              ]}
            >
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                onPress={() => setOpenLessonId(isOpen ? null : lesson.id)}
                style={styles.lessonButton}
              >
                <View style={styles.lessonHeading}>
                  <View style={styles.lessonCopy}>
                    <Text style={[styles.lessonOrder, { color: colors.accent1 }]}>
                      Lesson {lesson.order}
                    </Text>
                    <Text style={[styles.lessonTitle, { color: colors.textPrimary }]}>
                      {lesson.title}
                    </Text>
                    <Text style={[styles.lessonTitleMy, { color: colors.accent1 }]}>
                      {lesson.titleMy}
                    </Text>
                  </View>
                  {isOpen ? (
                    <ChevronUp size={22} color={colors.accent1} />
                  ) : (
                    <ChevronDown size={22} color={colors.accent1} />
                  )}
                </View>
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                  {lesson.description}
                </Text>
                <View style={styles.lessonMeta}>
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {lessonVocab.length} vocabulary items
                  </Text>
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {mastered} mastered
                  </Text>
                </View>
              </TouchableOpacity>

              {isOpen && (
                <View style={[styles.vocabList, { borderTopColor: colors.cardBorder }]}>
                  {lessonVocab.map((vocab) => (
                    <VocabCard
                      key={vocab.id}
                      vocab={vocab}
                      mastered={masteredIds.has(vocab.id)}
                      colors={colors}
                      t={t}
                      ttsSupported={ttsSupported}
                      speaking={speakingVocabId === vocab.id}
                      onSpeak={() => {
                        speakKorean(vocab.korean)
                        setSpeakingVocabId(vocab.id)
                      }}
                    />
                  ))}
                </View>
              )}
            </View>
          )
        })
      ) : (
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            This level is coming soon.
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            We are preparing more Korean lessons for you to enjoy together.
          </Text>
        </View>
      )}
    </ScrollView>
  )
}

function VocabCard({
  vocab,
  mastered,
  colors,
  t,
  ttsSupported,
  speaking,
  onSpeak,
}: {
  vocab: KoreanVocab
  mastered: boolean
  colors: ThemeColors
  t: (key: string) => string
  ttsSupported: boolean
  speaking: boolean
  onSpeak: () => void
}) {
  const styles = createStyles(colors, sizes)
  return (
    <View
      style={[
        styles.vocabCard,
        { backgroundColor: colors.surface, borderColor: colors.cardBorder },
      ]}
    >
      <View style={styles.vocabTop}>
        <View style={styles.vocabCopy}>
          <Text style={[styles.korean, { color: colors.textPrimary }]}>{vocab.korean}</Text>
          <Text style={[styles.romanization, { color: colors.accent1 }]}>{vocab.romanization}</Text>
        </View>
        {mastered && <Check size={20} color={colors.success} />}
      </View>
      <Text style={[styles.english, { color: colors.textPrimary }]}>{vocab.english}</Text>
      <Text style={[styles.myanmar, { color: colors.textSecondary }]}>{vocab.myanmar}</Text>
      {vocab.exampleSentence && (
        <View style={[styles.example, { backgroundColor: colors.background }]}>
          <Text style={[styles.exampleText, { color: colors.textPrimary }]}>
            {vocab.exampleSentence}
          </Text>
          {vocab.exampleTranslation && (
            <Text style={[styles.exampleTranslation, { color: colors.textSecondary }]}>
              {vocab.exampleTranslation}
            </Text>
          )}
        </View>
      )}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`${t('learning.listen')} ${vocab.korean}`}
        accessibilityState={{ disabled: !ttsSupported }}
        disabled={!ttsSupported}
        onPress={onSpeak}
        style={[styles.ttsButton, { borderColor: colors.cardBorder }]}
      >
        <Volume2 size={16} color={colors.textSecondary} />
        <Text style={[styles.ttsText, { color: colors.textSecondary }]}>
          {speaking ? 'Speaking...' : t('learning.listen')}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const createStyles = (colors: ThemeColors, sizes: Sizes) =>
  StyleSheet.create({
    screen: { flex: 1 },
    content: { padding: 20, paddingBottom: 40, gap: 18 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    headerIcon: {
      width: 52,
      height: 52,
      borderRadius: sizes.radius.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    headerCopy: { flex: 1 },
    title: { fontSize: sizes.text.hLg, fontWeight: '700' },
    subtitle: { marginTop: 4, fontSize: sizes.text.sm, lineHeight: 20 },
    progressCard: {
      borderWidth: 1,
      borderRadius: sizes.radius.card,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    progressCopy: { gap: 4 },
    progressLabel: { fontSize: sizes.text.xs },
    progressValue: { fontSize: sizes.text.body, fontWeight: '700' },
    levelTabs: { gap: 8, paddingRight: 12 },
    levelTab: {
      borderWidth: 1,
      borderRadius: sizes.radius.pill,
      paddingHorizontal: 17,
      paddingVertical: 10,
    },
    levelTabText: { fontSize: sizes.text.sm, fontWeight: '700' },
    sectionHeading: { gap: 4 },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sectionTitle: { fontSize: sizes.text.hMd, fontWeight: '700' },
    sectionSubtitle: { fontSize: sizes.text.sm },
    quizButton: {
      alignSelf: 'flex-start',
      borderRadius: sizes.radius.input,
      paddingHorizontal: 16,
      paddingVertical: 11,
      marginTop: 8,
    },
    quizButtonText: { fontSize: sizes.text.sm, fontWeight: '700' },
    lessonCard: { borderWidth: 1, borderRadius: sizes.radius.card, overflow: 'hidden' },
    lessonButton: { padding: 18, gap: 12 },
    lessonHeading: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    lessonCopy: { flex: 1, gap: 3 },
    lessonOrder: {
      fontSize: sizes.text.xs,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    lessonTitle: { fontSize: sizes.text.hSm, fontWeight: '700' },
    lessonTitleMy: { fontSize: sizes.text.sm },
    description: { fontSize: sizes.text.sm, lineHeight: 21 },
    lessonMeta: { flexDirection: 'row', justifyContent: 'space-between' },
    metaText: { fontSize: sizes.text.xs },
    vocabList: { borderTopWidth: 1, padding: 12, gap: 10 },
    vocabCard: { borderWidth: 1, borderRadius: sizes.radius.card, padding: 14, gap: 7 },
    vocabTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    vocabCopy: { gap: 2 },
    korean: { fontSize: sizes.text.hLg, fontWeight: '700' },
    romanization: { fontSize: sizes.text.sm },
    english: { fontSize: sizes.text.body, fontWeight: '600' },
    myanmar: { fontSize: sizes.text.body, lineHeight: 22 },
    example: { borderRadius: sizes.radius.input, padding: 10, marginTop: 4, gap: 4 },
    exampleText: { fontSize: sizes.text.sm, lineHeight: 19 },
    exampleTranslation: { fontSize: sizes.text.sm, lineHeight: 19 },
    ttsButton: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      borderWidth: 1,
      borderRadius: sizes.radius.input,
      paddingHorizontal: 10,
      paddingVertical: 7,
      marginTop: 3,
    },
    ttsText: { fontSize: sizes.text.xs, fontWeight: '600' },
    emptyCard: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderRadius: sizes.radius.card,
      padding: 28,
      gap: 8,
    },
    emptyTitle: { fontSize: sizes.text.bodyLg, fontWeight: '700', textAlign: 'center' },
    emptyText: { fontSize: sizes.text.sm, lineHeight: 21, textAlign: 'center' },
  })
