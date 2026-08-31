import { useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

import { BucketListItem } from '@/components/BucketListItem'
import { Button } from '@/components/Button'
import { usePlans } from '@/hooks/usePlans'

export default function BucketListScreen() {
  const { bucketList, loading, error, addBucketItem, toggleBucketItem } = usePlans()
  const [item, setItem] = useState('')

  const handleAdd = async () => {
    const trimmed = item.trim()
    if (!trimmed) {
      Alert.alert('Need an idea', 'Write something you want to do together.')
      return
    }

    await addBucketItem(trimmed)
    setItem('')
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Bucket list</Text>
      <Text style={styles.subtitle}>Dream big, together.</Text>

      <View style={styles.composer}>
        <TextInput
          value={item}
          onChangeText={setItem}
          placeholder="Add a shared dream…"
          placeholderTextColor="#c4c4ce"
          style={styles.input}
        />
        <Button title="Add" onPress={() => void handleAdd()} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <Text style={styles.loading}>Loading…</Text> : null}

      {bucketList.length === 0 ? (
        <Text style={styles.empty}>No dreams yet. Add your first shared adventure.</Text>
      ) : (
        bucketList.map((entry) => (
          <BucketListItem
            key={entry.id}
            item={entry.item}
            completed={entry.completed}
            completedAt={entry.completed_at}
            onToggle={() => void toggleBucketItem(entry.id, !entry.completed)}
          />
        ))
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 72,
    paddingBottom: 40,
    backgroundColor: '#0f0f12',
  },
  title: {
    color: '#f3f0f5',
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#c4c4ce',
    fontSize: 15,
    marginBottom: 20,
  },
  composer: {
    backgroundColor: '#171b22',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2a2d35',
    padding: 18,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#0f0f12',
    borderWidth: 1,
    borderColor: '#2a2d35',
    borderRadius: 12,
    color: '#f3f0f5',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  error: {
    color: '#ff8a8a',
    marginBottom: 12,
  },
  loading: {
    color: '#d9bfd7',
    marginBottom: 12,
  },
  empty: {
    color: '#c4c4ce',
    marginTop: 12,
  },
})
