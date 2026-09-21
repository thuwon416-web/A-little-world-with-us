import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'expo-router'
import {
  Gamepad2,
  Sparkles,
  Trophy,
  type LucideIcon,
} from 'lucide-react-native'
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { useTheme } from '@/context/ThemeContext'
import type { ThemeColors } from '@/context/ThemeContext'
import { sizes, type Sizes } from '@/design-tokens'
import { calculateLoveScore } from '@/lib/love-score'
import { supabase } from '@/lib/supabase'

const winLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
]

function winner(board: string[]) {
  return winLines.find(([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c])
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: LucideIcon
  children: ReactNode
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors, sizes), [colors])

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Icon size={16} color={colors.textSecondary} />
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {title.toUpperCase()}
        </Text>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  )
}

function GameCard({
  title,
  subtitle,
  onPress,
  action = 'Play',
}: {
  title: string
  subtitle: string
  onPress: () => void
  action?: string
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors, sizes), [colors])

  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
    >
      <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      <Text style={[styles.cardAction, { color: colors.accent1 }]}>{action} {'\u2192'}</Text>
    </TouchableOpacity>
  )
}

export default function GamesScreen() {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors, sizes), [colors])
  const [board, setBoard] = useState<string[]>(Array(9).fill(''))
  const [xNext, setXNext] = useState(true)
  const [loveScore, setLoveScore] = useState(0)

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      const name = String(data.user?.user_metadata?.full_name ?? data.user?.email ?? 'you')
      setLoveScore(calculateLoveScore(name, 'partner'))
    })
  }, [])

  const play = (index: number) => {
    if (board[index] || winner(board)) return
    const next = [...board]
    next[index] = xNext ? 'X' : 'O'
    setBoard(next)
    setXNext(!xNext)
    if (winner(next)) Alert.alert('Game over', `${next[index]} wins!`)
  }

  const comingSoon = (title: string) => Alert.alert(title, 'Coming soon!')

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.container}
    >
      <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <Gamepad2 size={28} color={colors.accent1} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>Couple Games</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Little games for two hearts.
        </Text>
      </View>

      <Section title="Quizzes" icon={Sparkles}>
        <GameCard
          title="Couple Quiz"
          subtitle="Take turns answering and compare your memories."
          onPress={() => Alert.alert('Quiz', 'Create a shared question deck from your memories.')}
        />
        <GameCard
          title="Love Quiz"
          subtitle="15 questions about the little things you know."
          onPress={() => comingSoon('Love Quiz')}
        />
        <GameCard
          title="Would You Rather"
          subtitle="20 playful questions for two."
          onPress={() => comingSoon('Would You Rather')}
        />
        <GameCard
          title="Never Have I Ever"
          subtitle="30 questions for shared stories."
          onPress={() => comingSoon('Never Have I Ever')}
        />
        <GameCard
          title="36 Questions"
          subtitle="36 prompts for a deeper connection."
          onPress={() => comingSoon('36 Questions')}
        />
        <GameCard
          title="Daily Question"
          subtitle="New question every day."
          onPress={() => comingSoon('Daily Question')}
        />
      </Section>

      <Section title="Playful" icon={Gamepad2}>
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Love Calculator</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            A playful score for your shared story.
          </Text>
          <Text style={[styles.score, { color: colors.accent2 }]}>{loveScore}%</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Tic-Tac-Toe</Text>
          <View style={styles.board}>
            {board.map((value, index) => (
              <TouchableOpacity
                key={index}
                accessibilityRole="button"
                onPress={() => play(index)}
                style={[styles.cell, { borderColor: colors.cardBorder }]}
              >
                <Text style={[styles.cellText, { color: colors.accent2 }]}>{value}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.accent1 }]}
            onPress={() => {
              setBoard(Array(9).fill(''))
              setXNext(true)
            }}
          >
            <Text style={[styles.buttonText, { color: colors.background }]}>New game</Text>
          </TouchableOpacity>
        </View>

        <GameCard title="Scavenger Hunt" subtitle="Find hidden clues." onPress={() => comingSoon('Scavenger Hunt')} />
        <GameCard title="Love Weather" subtitle="Share your mood." onPress={() => comingSoon('Love Weather')} />
        <GameCard title="Couple Scoreboard" subtitle="Track your wins." onPress={() => comingSoon('Couple Scoreboard')} />
        <GameCard title="Future Predictions" subtitle="Playful predictions." onPress={() => comingSoon('Future Predictions')} />
        <GameCard title="Gift Recommender" subtitle="Gift ideas for two." onPress={() => comingSoon('Gift Recommender')} />
      </Section>

      <Section title="Quests" icon={Trophy}>
        <GameCard
          title="Relationship Quests"
          subtitle="Complete shared quests and earn love points."
          action="Open Wellness"
          onPress={() => router.push('/(tabs)/wellness')}
        />
      </Section>
    </ScrollView>
  )
}

const createStyles = (colors: ThemeColors, sizes: Sizes) =>
  StyleSheet.create({
    scroll: { flex: 1 },
    container: { padding: 20, paddingTop: 72, paddingBottom: 40, gap: 28 },
    hero: { borderWidth: 1, borderRadius: sizes.radius.panel, padding: 20, gap: 8 },
    title: { fontSize: sizes.text.hLg, fontWeight: '700' },
    subtitle: { fontSize: sizes.text.body, lineHeight: 22 },
    section: { gap: 12 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sectionTitle: { fontSize: sizes.text.xs, fontWeight: '700', letterSpacing: 1.5 },
    sectionContent: { gap: 12 },
    card: { borderWidth: 1, borderRadius: sizes.radius.card, padding: 16, gap: 8 },
    cardTitle: { fontSize: sizes.text.bodyLg, fontWeight: '700' },
    cardSubtitle: { fontSize: sizes.text.sm, lineHeight: 20 },
    cardAction: { fontSize: sizes.text.sm, fontWeight: '700', marginTop: 4 },
    score: { fontSize: sizes.text.hLg, fontWeight: '800', marginTop: 4 },
    board: { width: 210, flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
    cell: { width: 70, height: 70, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    cellText: { fontSize: sizes.text.hLg },
    button: { borderRadius: sizes.radius.input, padding: 13, alignItems: 'center', marginTop: 8 },
    buttonText: { fontWeight: '800' },
  })
