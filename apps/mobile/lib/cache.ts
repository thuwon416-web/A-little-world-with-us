import * as FileSystem from 'expo-file-system/legacy'

const CACHE_DIR = `${FileSystem.cacheDirectory}media/`
const MAX_BYTES = 50 * 1024 * 1024

export async function ensureMediaCache() {
  await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true }).catch(() => undefined)
}

export async function evictMediaCache() {
  await ensureMediaCache()
  const names = await FileSystem.readDirectoryAsync(CACHE_DIR)
  const entries = await Promise.all(names.map(async (name) => {
    const info = await FileSystem.getInfoAsync(`${CACHE_DIR}${name}`)
    return { name, size: info.exists ? (info.size ?? 0) : 0, modified: info.exists ? (info.modificationTime ?? 0) : 0 }
  }))
  let total = entries.reduce((sum, item) => sum + item.size, 0)
  for (const entry of entries.sort((a, b) => a.modified - b.modified)) {
    if (total <= MAX_BYTES) break
    await FileSystem.deleteAsync(`${CACHE_DIR}${entry.name}`, { idempotent: true }).catch(() => undefined)
    total -= entry.size
  }
}

export function mediaCachePath(name: string) {
  return `${CACHE_DIR}${encodeURIComponent(name)}`
}

export const evictMediaCacheIfNeeded = evictMediaCache
