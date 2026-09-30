import * as Crypto from 'expo-crypto'
import * as LocalAuthentication from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'
import { useEffect, useState } from 'react'
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native'

import SecondaryPage, { secondaryStyles as s } from '@/components/SecondaryPage'
import PasswordList from '@/components/vault/PasswordList'
import VaultSetupModal from '@/components/vault/VaultSetupModal'
import VaultTabs, { type VaultTab } from '@/components/vault/VaultTabs'
import { useTheme } from '@/context/ThemeContext'
import { VaultKeyProvider, useVaultKey } from '@/contexts/VaultKeyContext'
import { loadWrappedKey } from '@/lib/vault-storage'
import { addVaultItem, deleteVaultItem, getContext, getVaultItems } from '@/services/secondary'
import type { VaultItem } from '@/shared-types'

function getErrorMessage(cause: unknown, fallback: string) {
  return cause instanceof Error ? cause.message : fallback
}

function isVaultItemValid(title: string, content: string) {
  return Boolean(title.trim() && content.trim() && content.length <= 1000)
}

function VaultLettersContent({
  items,
  title,
  content,
  photoUrl,
  placeholderTextColor,
  onTitleChange,
  onContentChange,
  onPhotoUrlChange,
  onAdd,
  onDelete,
}: {
  items: VaultItem[]
  title: string
  content: string
  photoUrl: string
  placeholderTextColor: string
  onTitleChange: (value: string) => void
  onContentChange: (value: string) => void
  onPhotoUrlChange: (value: string) => void
  onAdd: () => void
  onDelete: (id: string) => void
}) {
  return (
    <>
      <TextInput
        style={s.input}
        value={title}
        onChangeText={onTitleChange}
        placeholder="Title"
        placeholderTextColor={placeholderTextColor}
      />
      <TextInput
        style={s.input}
        value={content}
        onChangeText={onContentChange}
        placeholder="Secret or note"
        placeholderTextColor={placeholderTextColor}
        multiline
      />
      <TextInput
        style={s.input}
        value={photoUrl}
        onChangeText={onPhotoUrlChange}
        placeholder="Photo URL (optional)"
        placeholderTextColor={placeholderTextColor}
        autoCapitalize="none"
      />
      <TouchableOpacity style={s.button} onPress={onAdd}>
        <Text style={s.buttonText}>Add to vault</Text>
      </TouchableOpacity>
      {items.map((item) => (
        <View key={item.id} style={s.card}>
          <Text style={s.buttonText}>{item.title}</Text>
          <Text style={s.muted}>{item.content}</Text>
          {item.photo_url ? <Text style={s.muted}>Photo attached</Text> : null}
          <TouchableOpacity onPress={() => onDelete(item.id)}>
            <Text style={s.danger}>Delete</Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  )
}

function PasswordVaultContent({
  hasWrappedKey,
  passwordUnlocked,
  masterKey,
  passphrase,
  passwordError,
  showSetup,
  placeholderTextColor,
  onPassphraseChange,
  onUnlockPassphrase,
  onUnlockBiometric,
  onOpenSetup,
  onCloseSetup,
  onSetupReady,
}: {
  hasWrappedKey: boolean | null
  passwordUnlocked: boolean
  masterKey: ReturnType<typeof useVaultKey>['masterKey']
  passphrase: string
  passwordError: string
  showSetup: boolean
  placeholderTextColor: string
  onPassphraseChange: (value: string) => void
  onUnlockPassphrase: () => void
  onUnlockBiometric: () => void
  onOpenSetup: () => void
  onCloseSetup: () => void
  onSetupReady: () => void
}) {
  return (
    <>
      {!hasWrappedKey ? (
        <View style={s.card}>
          <Text style={s.buttonText}>Set up your password vault</Text>
          <Text style={s.muted}>Create a separate passphrase for encrypted credentials.</Text>
          <TouchableOpacity style={s.button} onPress={onOpenSetup}>
            <Text style={s.buttonText}>Set up Vault Passphrase</Text>
          </TouchableOpacity>
        </View>
      ) : !passwordUnlocked ? (
        <View style={s.card}>
          <Text style={s.buttonText}>Unlock passwords</Text>
          <TextInput
            style={s.input}
            value={passphrase}
            onChangeText={onPassphraseChange}
            placeholder="Vault passphrase"
            placeholderTextColor={placeholderTextColor}
            secureTextEntry
          />
          {passwordError ? <Text style={s.danger}>{passwordError}</Text> : null}
          <TouchableOpacity style={s.button} onPress={onUnlockPassphrase}>
            <Text style={s.buttonText}>Unlock passwords</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onUnlockBiometric}>
            <Text style={s.muted}>Use biometric unlock</Text>
          </TouchableOpacity>
        </View>
      ) : masterKey ? (
        <View>
          <Text style={s.muted}>Unlocked · password vault auto-locks after five minutes.</Text>
          <PasswordList masterKey={masterKey} />
        </View>
      ) : null}
      <VaultSetupModal visible={showSetup} onClose={onCloseSetup} onReady={onSetupReady} />
    </>
  )
}

export default function VaultScreen() {
  return (
    <VaultKeyProvider>
      <VaultScreenContent />
    </VaultKeyProvider>
  )
}

function VaultScreenContent() {
  const { colors } = useTheme()
  const {
    masterKey,
    isUnlocked: passwordUnlocked,
    unlockWithPassphrase,
    unlockWithBiometric,
  } = useVaultKey()
  const [items, setItems] = useState<VaultItem[]>([])
  const [coupleId, setCoupleId] = useState('')
  const [userId, setUserId] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [pin, setPin] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<VaultTab>('letters')
  const [hasWrappedKey, setHasWrappedKey] = useState<boolean | null>(null)
  const [passphrase, setPassphrase] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showSetup, setShowSetup] = useState(false)
  const load = async () => {
    try {
      const context = await getContext()
      if (!context.coupleId) throw new Error('Link your couple before using the vault.')
      setCoupleId(context.coupleId)
      setUserId(context.user.id)
      setItems(await getVaultItems(context.coupleId))
    } catch (error_) {
      setError(getErrorMessage(error_, 'Unable to load vault.'))
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
  useEffect(() => {
    void loadWrappedKey().then((stored) => setHasWrappedKey(Boolean(stored)))
  }, [passwordUnlocked])
  const add = async () => {
    if (!isVaultItemValid(title, content))
      return Alert.alert('Invalid item', 'Enter a title and content up to 1,000 characters.')
    try {
      await addVaultItem(coupleId, userId, title.trim(), content.trim(), photoUrl.trim())
      setTitle('')
      setContent('')
      setPhotoUrl('')
      await load()
    } catch (error_) {
      Alert.alert('Unable to save', getErrorMessage(error_, 'Please try again.'))
    }
  }
  const deleteItem = (id: string) => {
    Alert.alert('Delete item?', '', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void deleteVaultItem(id).then(load),
      },
    ])
  }
  const unlockPasswordsWithPassphrase = () => {
    void unlockWithPassphrase(passphrase).catch((cause) =>
      setPasswordError(getErrorMessage(cause, 'Unable to unlock passwords.'))
    )
  }
  const unlockPasswordsWithBiometric = () => {
    void unlockWithBiometric().catch((cause) =>
      setPasswordError(getErrorMessage(cause, 'Biometric unlock is unavailable.'))
    )
  }
  const setupReady = () => {
    setShowSetup(false)
    void loadWrappedKey().then((stored) => setHasWrappedKey(Boolean(stored)))
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
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            keyboardType="number-pad"
          />
          <TouchableOpacity style={s.button} onPress={() => void unlock()}>
            <Text style={s.buttonText}>Unlock vault</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <VaultTabs tab={tab} onChange={setTab} />
          {tab === 'letters' ? (
            <VaultLettersContent
              items={items}
              title={title}
              content={content}
              photoUrl={photoUrl}
              placeholderTextColor={colors.textSecondary}
              onTitleChange={setTitle}
              onContentChange={setContent}
              onPhotoUrlChange={setPhotoUrl}
              onAdd={() => void add()}
              onDelete={deleteItem}
            />
          ) : (
            <PasswordVaultContent
              hasWrappedKey={hasWrappedKey}
              passwordUnlocked={passwordUnlocked}
              masterKey={masterKey}
              passphrase={passphrase}
              passwordError={passwordError}
              showSetup={showSetup}
              placeholderTextColor={colors.textSecondary}
              onPassphraseChange={setPassphrase}
              onUnlockPassphrase={unlockPasswordsWithPassphrase}
              onUnlockBiometric={unlockPasswordsWithBiometric}
              onOpenSetup={() => setShowSetup(true)}
              onCloseSetup={() => setShowSetup(false)}
              onSetupReady={setupReady}
            />
          )}
        </>
      )}
    </SecondaryPage>
  )
}
