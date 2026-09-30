const DB_NAME = 'a-little-world-vault'
const STORE_NAME = 'wrapped-keys'
const KEY_ID = 'current'

export type WrappedKeyStorage = {
  ciphertext: string
  iv: string
  salt: string
  version: number
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Unable to open Vault storage'))
  })
}

export async function saveWrappedKey(data: WrappedKeyStorage): Promise<void> {
  const database = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(data, KEY_ID)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error ?? new Error('Unable to save wrapped Vault key'))
  })
  database.close()
}

export async function loadWrappedKey(): Promise<WrappedKeyStorage | null> {
  const database = await openDatabase()
  const data = await new Promise<WrappedKeyStorage | undefined>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(KEY_ID)
    request.onsuccess = () => resolve(request.result as WrappedKeyStorage | undefined)
    request.onerror = () => reject(request.error ?? new Error('Unable to load wrapped Vault key'))
  })
  database.close()
  return data ?? null
}

export async function clearWrappedKey(): Promise<void> {
  const database = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(KEY_ID)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error ?? new Error('Unable to clear wrapped Vault key'))
  })
  database.close()
}
