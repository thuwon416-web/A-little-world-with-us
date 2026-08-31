import { useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { useAI } from '@/hooks/useAI'

export default function AIAssistantScreen() {
  const [tab, setTab] = useState<'gift' | 'date' | 'message'>('gift')
  const { items, state, error, refreshSuggestions } = useAI()

  const filteredItems = items.filter((item) => item.suggestion_type === tab)

  const handleRefresh = async () => {
    await refreshSuggestions(tab)
  }

  const saveFavorite = (content: string) => {
    Alert.alert('Saved', 'Suggestion saved to favorites')
  }

  const copyText = async (content: string) => {
    await Clipboard.setStringAsync(content)
    Alert.alert('Copied', 'Suggestion copied to clipboard')
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Love Assistant</Text>

      <View style={styles.tabs}>
        {(['gift', 'date', 'message'] as const).map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, tab === key && styles.activeTab]}
            onPress={() => setTab(key)}
          >
            <Text style={[styles.tabText, tab === key && styles.activeTabText]}>
              {key === 'gift' ? 'Gift Ideas' : key === 'date' ? 'Date Ideas' : 'Message Helper'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.refreshButton} onPress={() => void handleRefresh()}>
        <Text style={styles.refreshText}>{state === 'loading' ? 'Generating...' : 'Refresh ideas'}</Text>
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {filteredItems.length === 0 ? (
          <Text style={styles.empty}>No suggestions yet. Tap refresh to generate something sweet.</Text>
        ) : (
          filteredItems.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.badge}>AI-generated</Text>
              <Text style={styles.content}>{item.content}</Text>

              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionButton} onPress={() => void copyText(item.content)}>
                  <Text style={styles.actionText}>Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => saveFavorite(item.content)}>
                  <Text style={styles.actionText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f12',
    paddingTop: 72,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    color: '#f3f0f5',
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
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#171b22',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2d35',
  },
  activeTab: {
    backgroundColor: '#b88ae5',
  },
  tabText: {
    color: '#f3f0f5',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#110d1a',
  },
  refreshButton: {
    backgroundColor: '#1f3b2f',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  refreshText: {
    color: '#f3f0f5',
    fontWeight: '700',
  },
  error: {
    color: '#ffb0bd',
    marginBottom: 12,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 12,
  },
  card: {
    backgroundColor: '#171b22',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2d35',
  },
  badge: {
    color: '#d9bfd7',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  content: {
    color: '#f3f0f5',
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
    backgroundColor: '#2a2d35',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionText: {
    color: '#f3f0f5',
    fontWeight: '600',
  },
  empty: {
    color: '#c4c4ce',
    fontSize: 14,
    lineHeight: 22,
  },
})
