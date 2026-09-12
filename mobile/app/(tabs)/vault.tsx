import * as Crypto from 'expo-crypto'
import * as LocalAuthentication from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'
import { useEffect, useState } from 'react'
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native'

import SecondaryPage, { secondaryStyles as s } from '@/components/SecondaryPage'
import { addVaultItem, deleteVaultItem, getContext, getVaultItems } from '@/services/secondary'

export default function VaultScreen() {
  const [items, setItems] = useState<any[]>([])
  const [coupleId, setCoupleId] = useState('')
  const [userId, setUserId] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [pin, setPin] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState('')
  const load = async () => {
    try {
      const context = await getContext()
      if (!context.coupleId) throw new Error('Link your couple before using the vault.')
      setCoupleId(context.coupleId)
      setUserId(context.user.id)
      setItems(await getVaultItems(context.coupleId))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load vault.')
    }
  }
  const unlock = async () => {
    const biometric = await LocalAuthentication.hasHardwareAsync()
    if (biometric) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock your private vault',
      })
      if (result.success) {
        setUnlocked(true)
        await load()
      }
      return
    }
    const storedPin = await SecureStore.getItemAsync('a-little-world-with-us-pin')
    const enteredHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin)
    if (!storedPin || enteredHash !== storedPin) {
      setError('Enter the PIN configured in Settings.')
      return
    }
    setUnlocked(true)
    await load()
  }
  useEffect(() => {
    void getContext().catch(() => setError('Please sign in again.'))
  }, [])
  useEffect(() => {
    if (!unlocked) return
    const timeout = setTimeout(
      () => {
        setUnlocked(false)
        setItems([])
      },
      5 * 60 * 1000
    )
    return () => clearTimeout(timeout)
  }, [unlocked])
  const add = async () => {
    if (!title.trim() || !content.trim() || content.length > 1000)
      return Alert.alert('Invalid item', 'Enter a title and content up to 1,000 characters.')
    try {
      await addVaultItem(coupleId, userId, title.trim(), content.trim(), photoUrl.trim())
      setTitle('')
      setContent('')
      setPhotoUrl('')
      await load()
    } catch (caught) {
      Alert.alert('Unable to save', caught instanceof Error ? caught.message : 'Please try again.')
    }
  }
  return (
    <SecondaryPage title="Private Vault">
      <Text style={s.muted}>Vault items are private to you and your partner.</Text>
      {error ? <Text style={s.danger}>{error}</Text> : null}
      {!unlocked ? (
        <>
          <TextInput
            style={s.input}
            value={pin}
            onChangeText={setPin}
            placeholder="PIN (if biometrics unavailable)"
            placeholderTextColor="#8d8d99"
            secureTextEntry
            keyboardType="number-pad"
          />
          <TouchableOpacity style={s.button} onPress={() => void unlock()}>
            <Text style={s.buttonText}>Unlock vault</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
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
            placeholder="Secret or note"
            placeholderTextColor="#8d8d99"
            multiline
          />
          <TextInput
            style={s.input}
            value={photoUrl}
            onChangeText={setPhotoUrl}
            placeholder="Photo URL (optional)"
            placeholderTextColor="#8d8d99"
            autoCapitalize="none"
          />
          <TouchableOpacity style={s.button} onPress={() => void add()}>
            <Text style={s.buttonText}>Add to vault</Text>
          </TouchableOpacity>
          {items.map((item) => (
            <View key={item.id} style={s.card}>
              <Text style={s.buttonText}>{item.title}</Text>
              <Text style={s.muted}>{item.content}</Text>
              {item.photo_url ? <Text style={s.muted}>Photo attached</Text> : null}
              <TouchableOpacity
                onPress={() =>
                  Alert.alert('Delete item?', '', [
                    { text: 'Cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => void deleteVaultItem(item.id).then(load),
                    },
                  ])
                }
              >
                <Text style={s.danger}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}
    </SecondaryPage>
  )
}
