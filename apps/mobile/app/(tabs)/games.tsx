import { Gamepad2 } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@/context/ThemeContext'
import type { ThemeColors } from '@/context/ThemeContext'
import { sizes, type Sizes } from '@/design-tokens'

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

export default function GamesScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => createStyles(colors, sizes), [colors])
  const [board, setBoard] = useState<string[]>(new Array(9).fill(''))
  const [xNext, setXNext] = useState(true)

  const play = (index: number) => {
    if (board[index] || winner(board)) return
    const next = [...board]
    next[index] = xNext ? 'X' : 'O'
    setBoard(next)
    setXNext(!xNext)
    if (winner(next)) Alert.alert('Game over', `${next[index]} wins!`)
  }

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <Gamepad2 size={28} color={colors.accent1} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>Play</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          A tiny game for two hearts.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Tic-Tac-Toe</Text>
        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
          Take a quick turn together.
        </Text>
        <View style={styles.board}>
          {board.map((value, index) => (
            <TouchableOpacity
              key={index}
              accessibilityRole="button"
              accessibilityLabel={value ? `Cell ${index + 1}: ${value}` : `Empty cell ${index + 1}`}
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
            setBoard(new Array(9).fill(''))
            setXNext(true)
          }}
        >
          <Text style={[styles.buttonText, { color: colors.background }]}>New game</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const createStyles = (colors: ThemeColors, sizes: Sizes) =>
  StyleSheet.create({
    scroll: { flex: 1 },
    container: { padding: 20, paddingBottom: 40, gap: 20 },
    hero: { borderWidth: 1, borderRadius: sizes.radius.panel, padding: 20, gap: 8 },
    title: { fontSize: sizes.text.hLg, fontWeight: '700' },
    subtitle: { fontSize: sizes.text.body, lineHeight: 22 },
    card: { borderWidth: 1, borderRadius: sizes.radius.card, padding: 16, gap: 8 },
    cardTitle: { fontSize: sizes.text.bodyLg, fontWeight: '700' },
    cardSubtitle: { fontSize: sizes.text.sm, lineHeight: 20 },
    board: { width: 210, flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, alignSelf: 'center' },
    cell: { width: 70, height: 70, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    cellText: { fontSize: sizes.text.hLg },
    button: { borderRadius: sizes.radius.input, padding: 13, alignItems: 'center', marginTop: 8 },
    buttonText: { fontWeight: '800' },
  })
