import * as FileSystem from 'expo-file-system/legacy'

const CACHE_DIR = `${FileSystem.cacheDirectory ?? ''}media-cache/`
const MAX_BYTES = 50 * 1024 * 1024

export async function ensureMediaCache() {
  if (!CACHE_DIR) return
  const info = await FileSystem.getInfoAsync(CACHE_DIR)
  if (!info.exists) await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true })
}

export async function cacheMedia(uri: string, key: string) {
  await ensureMediaCache()
  const target = `${CACHE_DIR}${encodeURIComponent(key)}`
  const existing = await FileSystem.getInfoAsync(target)
  if (existing.exists) return target
  const result = await FileSystem.downloadAsync(uri, target)
  await evictMediaCache()
  return result.uri
}

export async function evictMediaCache() {
  await ensureMediaCache()
  const names = await FileSystem.readDirectoryAsync(CACHE_DIR)
  const entries = []
  for (const name of names) {
    const info = await FileSystem.getInfoAsync(`${CACHE_DIR}${name}`)
    if (info.exists) entries.push({ name, size: info.size ?? 0, mtime: info.modificationTime ?? 0 })
  }
  entries.sort((a, b) => a.mtime - b.mtime)
  let total = entries.reduce((sum, item) => sum + item.size, 0)
  for (const entry of entries) {
    if (total <= MAX_BYTES) break
    await FileSystem.deleteAsync(`${CACHE_DIR}${entry.name}`, { idempotent: true })
    total -= entry.size
  }
}

export const MEDIA_CACHE_MAX_BYTES = MAX_BYTES
