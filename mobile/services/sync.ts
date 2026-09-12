import { Q } from '@nozbe/watermelondb'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { database } from '@/database'
import { MessageModel, OfflineQueueModel } from '@/database/schema'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { ChatMessage } from '@/shared-types'

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'
type MessageFields = {
  content: string
  sender_id: string
  couple_id: string
  message_type: string
  media_url: string
  media_duration: number | null
  reply_to: string
  location_payload: string
  created_at: string
  synced: boolean
}
type LocalMessage = MessageModel & MessageFields & { _get<T>(column: string): T }

// Helper function to get authenticated user ID
async function getUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('User not authenticated')
  }
  return user.id
}

// Helper function to get couple ID for the authenticated user
async function getCoupleId(): Promise<string | null> {
  try {
    const userId = await getUserId()
    const { data, error } = await supabase
      .from('couple_links')
      .select('couple_id')
      .or(`inviter_id.eq.${userId},accepted_by.eq.${userId}`)
      .eq('status', 'accepted')
      .single()

    if (error || !data) {
      return null
    }
    return data.couple_id
  } catch {
    return null
  }
}

export async function countPendingMessages() {
  const pending = await database.get('messages').query(Q.where('synced', false)).fetch()
  return pending.length
}

export async function pushPendingMessages() {
  if (!isSupabaseConfigured) {
    return 0
  }

  const pending = await database.get('messages').query(Q.where('synced', false)).fetch()
  const coupleId = await getCoupleId()
  if (!coupleId) {
    throw new Error('No accepted couple link found')
  }

  for (const message of pending) {
    const rawMessage = message as unknown as LocalMessage
    const payload = {
      id: rawMessage.id,
      content: rawMessage._get('content'),
      sender_id: rawMessage._get('sender_id'),
      couple_id: rawMessage._get('couple_id') || coupleId,
      created_at: rawMessage._get('created_at'),
      message_type: rawMessage._get('message_type') || 'text',
      location_payload: (() => {
        const value = rawMessage._get<string>('location_payload')
        try {
          return value ? JSON.parse(value) : null
        } catch {
          return null
        }
      })(),
      media_url: rawMessage._get('media_url') || null,
      media_duration: rawMessage._get('media_duration') || null,
      reply_to: rawMessage._get('reply_to') || null,
    }

    const { error } = await supabase.from('messages').upsert(payload).select()

    if (!error) {
      await database.write(async () => {
        await rawMessage.update((record) => {
          const fields = record as unknown as MessageFields
          fields.synced = true
        })
      })
    }
  }

  return pending.length
}

export async function syncMessages(lastSyncAt?: string) {
  if (!isSupabaseConfigured) {
    const pending = await countPendingMessages()
    return { synced: 0, pending }
  }

  // Get authenticated user
  // Get couple ID for filtering
  const coupleId = await getCoupleId()
  if (!coupleId) {
    throw new Error('No accepted couple link found')
  }

  // Fetch messages with pagination
  let allMessages: ChatMessage[] = []
  let page = 0
  const pageSize = 100

  const effectiveLastSyncAt =
    lastSyncAt ?? (await AsyncStorage.getItem(`messages:last-synced:${coupleId}`))
  while (true) {
    let query = supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1)

    query = query.eq('couple_id', coupleId)

    // Filter by last sync time if provided
    if (effectiveLastSyncAt) {
      query = query.gte('created_at', effectiveLastSyncAt)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(error.message)
    }

    if (!data || data.length === 0) break

    allMessages = [...allMessages, ...data]
    page++

    if (data.length < pageSize) break
  }

  // Batch insert/update locally
  if (allMessages.length > 0) {
    await database.write(async () => {
      // First, collect all message IDs to check against local database
      const messageIds = allMessages.map((msg) => msg.id)

      // Batch fetch existing messages to avoid N+1 queries
      const existingMessages = await database
        .get('messages')
        .query(Q.where('id', Q.oneOf(messageIds)))
        .fetch()

      const existingMap = new Map(
        existingMessages.map((msg) => [msg.id, msg as unknown as LocalMessage])
      )

      // Process each remote message
      for (const remoteMessage of allMessages) {
        const localMessage = existingMap.get(remoteMessage.id)

        if (!localMessage) {
          // Create new message
          await database.get<MessageModel>('messages').create((record) => {
            const fields = record as unknown as MessageFields
            fields.content = remoteMessage.content ?? ''
            fields.sender_id = remoteMessage.sender_id ?? 'unknown'
            fields.couple_id = remoteMessage.couple_id ?? ''
            fields.created_at = remoteMessage.created_at ?? new Date().toISOString()
            fields.message_type = remoteMessage.message_type ?? 'text'
            fields.location_payload = remoteMessage.location_payload
              ? JSON.stringify(remoteMessage.location_payload)
              : ''
            fields.media_url = remoteMessage.media_url ?? ''
            fields.media_duration = remoteMessage.media_duration ?? null
            fields.reply_to = remoteMessage.reply_to ?? ''
            fields.synced = true
          })
        } else {
          // Update existing message if remote is newer
          const localCreatedAt = localMessage._get('created_at') ?? ''
          if ((remoteMessage.created_at ?? '') > localCreatedAt) {
            await localMessage.update((record) => {
              const fields = record as unknown as MessageFields
              fields.content = remoteMessage.content ?? fields.content
              fields.sender_id = remoteMessage.sender_id ?? fields.sender_id
              fields.couple_id = remoteMessage.couple_id ?? fields.couple_id
              fields.created_at = remoteMessage.created_at ?? fields.created_at
              fields.message_type = remoteMessage.message_type ?? fields.message_type
              fields.location_payload = remoteMessage.location_payload
                ? JSON.stringify(remoteMessage.location_payload)
                : fields.location_payload
              fields.media_url = remoteMessage.media_url ?? fields.media_url
              fields.media_duration = remoteMessage.media_duration ?? fields.media_duration
              fields.reply_to = remoteMessage.reply_to ?? fields.reply_to
              fields.synced = true
            })
          }
        }
      }
    })
  }

  await AsyncStorage.setItem(`messages:last-synced:${coupleId}`, new Date().toISOString())
  const pending = await pushPendingMessages()
  return { synced: allMessages.length, pending }
}

export async function flushOfflineQueue() {
  const queue = await database.get<OfflineQueueModel>('offline_queue').query().fetch()
  let flushed = 0
  for (const item of queue) {
    try {
      const body = JSON.parse(item.body) as { table?: string; values?: Record<string, unknown> }
      if (!body.table || item.method !== 'POST') throw new Error('Unsupported offline request')
      const { error } = await supabase.from(body.table).insert(body.values ?? {})
      if (error) throw error
      await database.write(async () => item.markAsDeleted())
      flushed += 1
    } catch {
      const nextRetry = item.retry_count + 1
      await database.write(async () => {
        await item.update((updated) => {
          updated.retry_count = nextRetry
        })
      })
      if (nextRetry >= 3) await database.write(async () => item.markAsDeleted())
    }
  }
  return flushed
}

export function subscribeToChanges(onChange: () => void, coupleId?: string) {
  if (!isSupabaseConfigured) {
    return { unsubscribe: () => undefined }
  }

  const channel = supabase
    .channel(`mobile-chat-sync-${coupleId ?? 'unknown'}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        ...(coupleId ? { filter: `couple_id=eq.${coupleId}` } : {}),
      },
      () => {
        onChange()
      }
    )
    .subscribe()

  return {
    unsubscribe: () => {
      void supabase.removeChannel(channel)
    },
  }
}
