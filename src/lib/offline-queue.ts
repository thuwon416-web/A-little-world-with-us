import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { SupabaseClient } from '@supabase/supabase-js'

interface QueuedMessage {
  id: string
  couple_id: string
  sender_id: string
  content: string
  message_type: string
  encrypted: boolean
  reply_to: string | null
  created_at: string
  timestamp: number
}

interface OfflineQueueDB extends DBSchema {
  messages: {
    key: string
    value: QueuedMessage
    indexes: {
      timestamp: number
    }
  }
}

const DB_NAME = 'offline-chat-queue'
const DB_VERSION = 1
const STORE_NAME = 'messages'

let db: IDBPDatabase<OfflineQueueDB> | null = null

async function getDB() {
  if (!db) {
    db = await openDB<OfflineQueueDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp')
      },
    })
  }
  return db
}

export async function enqueueMessage(message: QueuedMessage) {
  const database = await getDB()
  await database.put(STORE_NAME, message)
}

export async function dequeueMessages(): Promise<QueuedMessage[]> {
  const database = await getDB()
  const messages = await database.getAllFromIndex(STORE_NAME, 'timestamp')
  return messages.sort((a, b) => a.timestamp - b.timestamp)
}

export async function removeMessage(id: string) {
  const database = await getDB()
  await database.delete(STORE_NAME, id)
}

export async function clearQueue() {
  const database = await getDB()
  await database.clear(STORE_NAME)
}

export async function getQueueCount(): Promise<number> {
  const database = await getDB()
  return await database.count(STORE_NAME)
}

export async function processQueue(supabase: SupabaseClient, coupleId: string): Promise<number> {
  const messages = await dequeueMessages()
  let processed = 0

  for (const message of messages) {
    if (message.couple_id !== coupleId) continue

    try {
      const { error } = await supabase.from('messages').insert({
        couple_id: message.couple_id,
        sender_id: message.sender_id,
        content: message.content,
        message_type: message.message_type,
        encrypted: message.encrypted,
        reply_to: message.reply_to,
      })

      if (!error) {
        await removeMessage(message.id)
        processed++
      }
    } catch (error) {
      console.error('Failed to process queued message:', error)
    }
  }

  return processed
}
