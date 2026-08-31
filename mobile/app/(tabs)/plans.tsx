import { useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Button } from '@/components/Button'
import { PlanCard } from '@/components/PlanCard'
import { usePlans } from '@/hooks/usePlans'

export default function PlansScreen() {
  const router = useRouter()
  const { plans, loading, error, createPlan, togglePlanItem, updatePlan } = usePlans()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'date' | 'trip' | 'goal' | 'life' | 'other'>('date')
  const [showComposer, setShowComposer] = useState(false)

  const handleCreate = async () => {
    const trimmed = title.trim()
    if (!trimmed) {
      Alert.alert('Plan needed', 'Give your plan a title first.')
      return
    }

    const result = await createPlan({
      title: trimmed,
      description,
      type,
      status: 'active',
    })

    if (result) {
      setTitle('')
      setDescription('')
      setShowComposer(false)
    }
  }

  const handleCompletePlan = async (planId: string, status: string) => {
    await updatePlan(planId, { status: status === 'completed' ? 'active' : 'completed' })
  }

  const renderTypeButton = (value: typeof type) => (
    <TouchableOpacity
      key={value}
      onPress={() => setType(value)}
      style={[styles.typeButton, type === value && styles.typeButtonActive]}
    >
      <Text style={[styles.typeButtonText, type === value && styles.typeButtonTextActive]}>{value}</Text>
    </TouchableOpacity>
  )

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Shared plans</Text>
      <Text style={styles.subtitle}>Keep your dates, trips, and dreams moving together.</Text>

      <View style={styles.toolbar}>
        <Button title="New plan" onPress={() => setShowComposer((current) => !current)} />
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/bucket-list')}>
          <Text style={styles.secondaryButtonText}>Bucket list</Text>
        </TouchableOpacity>
      </View>

      {showComposer ? (
        <View style={styles.composer}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Plan title"
            placeholderTextColor="#c4c4ce"
            style={styles.input}
          />
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What are you planning?"
            placeholderTextColor="#c4c4ce"
            style={[styles.input, styles.textArea]}
            multiline
          />
          <View style={styles.typeRow}>{(['date', 'trip', 'goal', 'life', 'other'] as const).map(renderTypeButton)}</View>
          <Button title="Save plan" onPress={() => void handleCreate()} />
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <Text style={styles.loading}>Loading plans…</Text> : null}

      {plans.length === 0 ? (
        <Text style={styles.empty}>No plans yet. Start with a little dream for the two of you.</Text>
      ) : (
        plans.map((plan) => (
          <View key={plan.id}>
            <PlanCard
              plan={plan}
              onToggleItem={(itemId, completed) => void togglePlanItem(plan.id, itemId, completed)}
              onPress={() => void handleCompletePlan(plan.id, plan.status)}
            />
          </View>
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
  toolbar: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2a2d35',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#f3f0f5',
    fontWeight: '700',
    fontSize: 14,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  typeButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2a2d35',
    backgroundColor: '#11161d',
  },
  typeButtonActive: {
    backgroundColor: '#ff6b81',
    borderColor: '#ff6b81',
  },
  typeButtonText: {
    color: '#f3f0f5',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  typeButtonTextActive: {
    color: '#0f0f12',
    fontWeight: '700',
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
