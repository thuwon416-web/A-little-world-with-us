import * as Clipboard from 'expo-clipboard'
import { Sparkles } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

import { useTheme } from '@/context/ThemeContext'
import { useAI } from '@/hooks/useAI'
import { EmptyState } from '@/components/ui/EmptyState'
import { supabase } from '@/lib/supabase'
import { saveAISuggestion } from '@/services/favorites'

type Tool = 'gift' | 'date' | 'message' | 'coach' | 'letter' | 'surprise'

const tools: Array<{ id: Tool; label: string }> = [
  { id: 'gift', label: 'Gift Ideas' },
  { id: 'date', label: 'Date Ideas' },
  { id: 'message', label: 'Message Helper' },
  { id: 'coach', label: 'Love Coach' },
  { id: 'letter', label: 'Love Letter' },
  { id: 'surprise', label: 'Surprise Ideas' },
]

const instructions: Record<'coach' | 'letter' | 'surprise', string> = {
  coach:
    'Give warm, practical relationship advice. Be concise, non-judgmental, and suggest small realistic next steps.',
  letter:
    'Write a heartfelt, specific love letter. Use a warm, sincere tone and return only the letter.',
  surprise:
    'Create five private surprise ideas using only these details. Include a simple first step and approximate cost in MMK.',
}

export default function AIAssistantScreen() {
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const [tab, setTab] = useState<Tool>('gift')
  const [input, setInput] = useState('')
  const [customResult, setCustomResult] = useState('')
  const [customState, setCustomState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [customError, setCustomError] = useState<string | null>(null)
  const { items, state, error, refreshSuggestions } = useAI()

  const filteredItems = items.filter((item) => item.suggestion_type === tab)
  const isCustomTool = tab === 'coach' || tab === 'letter' || tab === 'surprise'
  const isLoading = isCustomTool ? customState === 'loading' : state === 'loading'
  const displayedError = isCustomTool ? customError : error

  const handleRefresh = async () => {
    if (!isCustomTool) {
      await refreshSuggestions(tab, input.trim() ? [input.trim()] : [])
      return
    }

    if (!input.trim()) {
      setCustomError('Tell us a little more first.')
      setCustomState('error')
      return
    }

    setCustomState('loading')
    setCustomError(null)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const webUrl = process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '')
      if (!webUrl || !session?.access_token) {
        throw new Error('Please sign in again.')
      }

      const response = await fetch(
        `${webUrl}/api/ai/${tab === 'surprise' ? 'surprise' : 'chat'}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body:
            tab === 'surprise'
              ? JSON.stringify({
                  occasion: 'A private surprise',
                  interests: input.trim(),
                })
              : JSON.stringify({
                  message: `${instructions[tab]}\n\nUser request: ${input.trim()}`,
                }),
        }
      )
      const body = (await response.json()) as {
        response?: string
        ideas?: string
        error?: string
      }
      const generated = tab === 'surprise' ? body.ideas : body.response
      if (!response.ok || !generated) {
        throw new Error(body.error || 'Unable to generate a response')
      }
      setCustomResult(generated)
      setCustomState('success')
    } catch (caught) {
      setCustomError(caught instanceof Error ? caught.message : 'Unable to generate a response')
      setCustomState('error')
    }
  }

  const saveFavorite = async (content: string) => {
    if (isCustomTool) {
      Alert.alert('Save unavailable', 'This tool does not support saved suggestions yet.')
      return
    }
    try {
      await saveAISuggestion(content, tab)
      Alert.alert('Saved', 'Suggestion saved to favorites')
    } catch (caught) {
      Alert.alert(
        'Save failed',
        caught instanceof Error ? caught.message : 'Unable to save suggestion.'
      )
    }
  }

  const copyText = async (content: string) => {
    await Clipboard.setStringAsync(content)
    Alert.alert('Copied', 'Suggestion copied to clipboard')
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>AI Love Assistant</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {tools.map(({ id, label }) => (
          <TouchableOpacity
            key={id}
            style={[
              styles.tab,
              { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              tab === id && { backgroundColor: colors.accent1 },
            ]}
            onPress={() => {
              setTab(id)
              setInput('')
              setCustomResult('')
              setCustomError(null)
              setCustomState('idle')
            }}
          >
            <Text
              style={[
                styles.tabText,
                { color: colors.textPrimary },
                tab === id && { color: colors.background },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TextInput
        style={[
          styles.input,
          {
            color: colors.textPrimary,
            backgroundColor: colors.cardBg,
            borderColor: colors.cardBorder,
          },
        ]}
        value={input}
        onChangeText={setInput}
        placeholder="Tell us what you need help with..."
        placeholderTextColor={colors.textSecondary}
        multiline
        maxLength={1000}
      />

      <TouchableOpacity
        style={[styles.refreshButton, { backgroundColor: colors.accent1 }]}
        onPress={() => void handleRefresh()}
        disabled={isLoading}
      >
        <Text style={[styles.refreshText, { color: colors.background }]}>
          {isLoading ? 'Generating...' : 'Refresh ideas'}
        </Text>
      </TouchableOpacity>

      {displayedError ? <Text style={[styles.error, { color: colors.error }]}>{displayedError}</Text> : null}

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {isCustomTool && customResult ? (
          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Text style={[styles.badge, { color: colors.accent2 }]}>AI-generated</Text>
            <Text style={[styles.content, { color: colors.textPrimary }]}>{customResult}</Text>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, { borderColor: colors.accent1 }]}
                onPress={() => void copyText(customResult)}
              >
                <Text style={[styles.actionText, { color: colors.textPrimary }]}>Copy</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : !isCustomTool && filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <View key={item.id} style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <Text style={[styles.badge, { color: colors.accent2 }]}>AI-generated</Text>
              <Text style={[styles.content, { color: colors.textPrimary }]}>{item.content}</Text>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionButton, { borderColor: colors.accent1 }]}
                  onPress={() => void copyText(item.content)}
                >
                  <Text style={[styles.actionText, { color: colors.textPrimary }]}>Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { borderColor: colors.accent1 }]}
                  onPress={() => void saveFavorite(item.content)}
                >
                  <Text style={[styles.actionText, { color: colors.textPrimary }]}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <EmptyState
            icon={Sparkles}
            title="No suggestions yet"
            description="Tap refresh to generate something sweet."
          />
        )}
      </ScrollView>
    </View>
  )
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 72,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    minWidth: 110,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  tabText: {
    fontWeight: '600',
  },
  input: {
    minHeight: 92,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  refreshButton: {
    backgroundColor: colors.accent1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  refreshText: {
    color: colors.background,
    fontWeight: '700',
  },
  error: {
    color: colors.error,
    marginBottom: 12,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  badge: {
    color: colors.accent2,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  content: {
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  actionButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accent1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  empty: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
})
