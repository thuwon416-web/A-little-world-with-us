import * as SecureStore from 'expo-secure-store'

const STORAGE_KEY = 'a-little-world-vault-wrapped-key'

export type WrappedKeyStorage = {
  ciphertext: string
  iv: string
  salt: string
  version: number
}

export async function saveWrappedKey(data: WrappedKeyStorage): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(data))
}

export async function loadWrappedKey(): Promise<WrappedKeyStorage | null> {
  const value = await SecureStore.getItemAsync(STORAGE_KEY)
  return value ? (JSON.parse(value) as WrappedKeyStorage) : null
}

export async function clearWrappedKey(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEY)
}
