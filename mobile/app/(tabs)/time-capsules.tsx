import { useEffect, useState } from 'react'
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native'

import SecondaryPage, { secondaryStyles as s } from '@/components/SecondaryPage'
import { addCapsule, deleteCapsule, getCapsules, getContext } from '@/services/secondary'
export default function TimeCapsulesScreen() {
  const [items, setItems] = useState<any[]>([])
  const [context, setContext] = useState<any>()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [unlock, setUnlock] = useState('')
  const [error, setError] = useState('')
  const load = async () => {
    try {
      const next = await getContext()
      setContext(next)
      if (next.coupleId) setItems(await getCapsules(next.coupleId))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load capsules.')
    }
  }
  useEffect(() => {
    void load()
  }, [])
  const add = async () => {
    const date = new Date(unlock)
    if (!title.trim() || !content.trim() || Number.isNaN(date.getTime()) || date <= new Date())
      return Alert.alert('Invalid capsule', 'Use a future unlock date, such as 2027-01-01T09:00.')
    const recipient =
      context?.link?.inviter_id === context.user.id
        ? context.link.accepted_by
        : context.link.inviter_id
    if (!recipient) return Alert.alert('Link a partner', 'A capsule needs a recipient.')
    try {
      await addCapsule(
        context.coupleId,
        context.user.id,
        recipient,
        title.trim(),
        content.trim(),
        date.toISOString()
      )
      setTitle('')
      setContent('')
      setUnlock('')
      await load()
    } catch (caught) {
      Alert.alert('Unable to save', caught instanceof Error ? caught.message : 'Please try again.')
    }
  }
  return (
    <SecondaryPage title="Time Capsules">
      <Text style={s.muted}>
        Write something for the future. Capsules stay locked until their unlock date.
      </Text>
      {error ? <Text style={s.danger}>{error}</Text> : null}
      <TextInput
        style={s.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Title"
        placeholderTextColor="#8d8d99"
      />
      <TextInput
        style={s.input}
        value={content}
        onChangeText={setContent}
        placeholder="Message"
        placeholderTextColor="#8d8d99"
        multiline
      />
      <TextInput
        style={s.input}
        value={unlock}
        onChangeText={setUnlock}
        placeholder="Unlock date (YYYY-MM-DD or ISO)"
        placeholderTextColor="#8d8d99"
      />
      <TouchableOpacity style={s.button} onPress={() => void add()}>
        <Text style={s.buttonText}>Seal capsule</Text>
      </TouchableOpacity>
      {items.map((item) => {
        const open = new Date(item.unlock_at) <= new Date()
        return (
          <View key={item.id} style={s.card}>
            <Text style={s.buttonText}>{item.title}</Text>
            <Text style={s.muted}>
              {open ? item.content : `Locked until ${new Date(item.unlock_at).toLocaleString()}`}
            </Text>
            <TouchableOpacity onPress={() => void deleteCapsule(item.id).then(load)}>
              <Text style={s.danger}>Delete</Text>
            </TouchableOpacity>
          </View>
        )
      })}
    </SecondaryPage>
  )
}
