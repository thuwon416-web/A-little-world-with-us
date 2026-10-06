import { Q } from '@nozbe/watermelondb'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { randomUUID } from 'expo-crypto'

import { database } from '@/database'
import { MessageModel, OfflineOpModel, OfflineQueueModel } from '@/database/schema'
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
  created_at: number
  synced: boolean
  encrypted: boolean
  encryption_version: number | null
  media_mime_type: string | null
  edited_at: string | null
  deleted_at: string | null
  transcript: string | null
  sync_version: number | null
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

  const coupleId = await getCoupleId()
  if (!coupleId) {
    throw new Error('No accepted couple link found')
  }

  // Only pending rows for the active couple may be uploaded. Empty couple IDs
  // are legacy local rows and are safely adopted by the active couple below.
  const pending = await database
    .get('messages')
    .query(Q.where('synced', false), Q.or(Q.where('couple_id', coupleId), Q.where('couple_id', '')))
    .fetch()

  const failures: string[] = []

  for (const message of pending) {
    const rawMessage = message as unknown as LocalMessage
    const payload = {
      id: rawMessage.id,
      content: rawMessage._get('content'),
      sender_id: rawMessage._get('sender_id'),
      couple_id: coupleId,
      created_at: new Date(rawMessage._get('created_at')).toISOString(),
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
      encrypted: rawMessage._get('encrypted') || false,
      encryption_version: rawMessage._get('encryption_version') || null,
      media_mime_type: rawMessage._get('media_mime_type') || null,
      edited_at: rawMessage._get('edited_at') || null,
      deleted_at: rawMessage._get('deleted_at') || null,
      transcript: rawMessage._get('transcript') || null,
    }

    const { data: result, error } = await supabase.rpc('apply_offline_op', {
      p_op_id: rawMessage.id,
      p_operation: 'CREATE',
      p_table_name: 'messages',
      p_row_id: rawMessage.id,
      p_base_version: 0,
      p_payload: payload,
    }).returns<unknown>().single()

    if (error) {
      failures.push(error.message)
      continue
    }

    await database.write(async () => {
      await rawMessage.update((record) => {
        const fields = record as unknown as MessageFields
        fields.synced = true
        const syncResult = result as { current_version?: number } | null
        fields.sync_version = syncResult?.current_version ?? 1
      })
    })
  }

  if (failures.length > 0) {
    throw new Error(`Failed to sync ${failures.length} pending message(s): ${failures.join('; ')}`)
  }

  return pending.length
}

async function performSyncMessages() {
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
  while (true) {
    let query = supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1)

    query = query.eq('couple_id', coupleId)

    const { data, error } = await query

    if (error) {
      throw new Error(error.message)
    }

    if (!data || data.length === 0) break

    allMessages = [...allMessages, ...data]
    page++

    if (data.length < pageSize) break
  }

  // Reconcile the local couple cache against the remote source of truth.
  {
    const remoteIds = new Set(allMessages.map((message) => message.id))
    await database.write(async () => {
      const messageIds = allMessages.map((msg) => msg.id)
      const existingMessages =
        messageIds.length > 0
          ? await database.get('messages').query(Q.where('id', Q.oneOf(messageIds))).fetch()
          : []

      const existingMap = new Map(
        existingMessages.map((msg) => [msg.id, msg as unknown as LocalMessage])
      )

      // Process each remote message
      for (const remoteMessage of allMessages) {
        const localMessage = existingMap.get(remoteMessage.id)
        const remoteDeletedAt = (remoteMessage as ChatMessage & { deleted_at?: string | null }).deleted_at

        if (remoteDeletedAt) {
          if (localMessage) await localMessage.markAsDeleted()
          continue
        }

        if (!localMessage) {
          // Create new message
          await database.get<MessageModel>('messages').create((record) => {
            const fields = record as unknown as MessageFields
            fields.content = remoteMessage.content ?? ''
            fields.sender_id = remoteMessage.sender_id ?? 'unknown'
            fields.couple_id = remoteMessage.couple_id ?? ''
            fields.created_at = remoteMessage.created_at
              ? new Date(remoteMessage.created_at).getTime()
              : Date.now()
            fields.message_type = remoteMessage.message_type ?? 'text'
            fields.location_payload = remoteMessage.location_payload
              ? JSON.stringify(remoteMessage.location_payload)
              : ''
            fields.media_url = remoteMessage.media_url ?? ''
            fields.media_duration = remoteMessage.media_duration ?? null
            fields.reply_to = remoteMessage.reply_to ?? ''
            fields.synced = true
            fields.encrypted = remoteMessage.encrypted ?? false
            fields.encryption_version = remoteMessage.encryption_version ?? null
            fields.media_mime_type = remoteMessage.media_mime_type ?? null
            fields.edited_at = remoteMessage.edited_at ?? null
            fields.deleted_at = remoteMessage.deleted_at ?? null
            fields.transcript = remoteMessage.transcript ?? null
            fields.sync_version = (remoteMessage as ChatMessage & { sync_version?: number }).sync_version ?? 1
          })
        } else {
          const localSynced = localMessage._get<boolean>('synced')
          if (!localSynced) continue

          const remoteCreatedAt = remoteMessage.created_at
            ? new Date(remoteMessage.created_at).getTime()
            : localMessage._get<number>('created_at') ?? Date.now()

          await localMessage.update((record) => {
              const fields = record as unknown as MessageFields
              fields.content = remoteMessage.content ?? fields.content
              fields.sender_id = remoteMessage.sender_id ?? fields.sender_id
              fields.couple_id = remoteMessage.couple_id ?? fields.couple_id
              fields.created_at = remoteCreatedAt || fields.created_at
              fields.message_type = remoteMessage.message_type ?? fields.message_type
              fields.location_payload = remoteMessage.location_payload
                ? JSON.stringify(remoteMessage.location_payload)
                : fields.location_payload
              fields.media_url = remoteMessage.media_url ?? fields.media_url
              fields.media_duration = remoteMessage.media_duration ?? fields.media_duration
              fields.reply_to = remoteMessage.reply_to ?? fields.reply_to
              fields.synced = true
              fields.encrypted = remoteMessage.encrypted ?? fields.encrypted
              fields.encryption_version =
                remoteMessage.encryption_version ?? fields.encryption_version
              fields.media_mime_type = remoteMessage.media_mime_type ?? fields.media_mime_type
              fields.edited_at = remoteMessage.edited_at ?? fields.edited_at
              fields.deleted_at = remoteMessage.deleted_at ?? fields.deleted_at
              fields.transcript = remoteMessage.transcript ?? fields.transcript
              fields.sync_version = (remoteMessage as ChatMessage & { sync_version?: number }).sync_version ?? fields.sync_version
            })
        }
      }

      const localCoupleMessages = await database
        .get('messages')
        .query(Q.where('couple_id', coupleId), Q.where('synced', true))
        .fetch()

      for (const localMessage of localCoupleMessages as unknown as LocalMessage[]) {
        if (!remoteIds.has(localMessage.id)) {
          await localMessage.markAsDeleted()
        }
      }
    })
  }

  const pending = await pushPendingMessages()
  await AsyncStorage.setItem(`messages:last-synced:${coupleId}`, new Date().toISOString())
  return { synced: allMessages.length, pending }
}

let syncInFlight: Promise<{ synced: number; pending: number }> | null = null

export function syncMessages() {
  if (syncInFlight) return syncInFlight
  syncInFlight = performSyncMessages().finally(() => {
    syncInFlight = null
  })
  return syncInFlight
}

export async function queueOfflineOperation(input: {
  operation: 'CREATE' | 'PATCH' | 'DELETE'
  tableName: 'messages'
  rowId: string
  baseVersion: number
  payload: Record<string, unknown>
  opId?: string
}) {
  const opId = input.opId ?? randomUUID()
  await database.write(async () => {
    await database.get<OfflineOpModel>('offline_ops').create((record) => {
      record.op_id = opId
      record.operation = input.operation
      record.table_name = input.tableName
      record.row_id = input.rowId
      record.base_version = input.baseVersion
      record.payload = JSON.stringify(input.payload)
      record.retry_count = 0
      record.created_at = Date.now()
    })
  })
  return opId
}

export async function flushOfflineOperations() {
  if (!isSupabaseConfigured) return { applied: 0, conflicts: 0 }
  const queue = await database.get<OfflineOpModel>('offline_ops').query().fetch()
  let applied = 0
  let conflicts = 0

  for (const item of queue) {
    try {
      const { data, error } = await supabase.rpc('apply_offline_op', {
        p_op_id: item.op_id,
        p_operation: item.operation,
        p_table_name: item.table_name,
        p_row_id: item.row_id,
        p_base_version: item.base_version,
        p_payload: JSON.parse(item.payload),
      }).returns<unknown>().single()
      if (error) throw error
      const syncResult = data as { conflict?: boolean } | null
      if (syncResult?.conflict) {
        conflicts += 1
        continue
      }
      await database.write(async () => item.markAsDeleted())
      applied += 1
    } catch {
      await database.write(async () => {
        await item.update((updated) => {
          updated.retry_count += 1
        })
      })
    }
  }

  return { applied, conflicts }
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
      // Keep failed work durable. It must remain available for a later retry rather than
      // disappearing after an arbitrary attempt count.
    }
  }
  return flushed
}

export function subscribeToChanges(
  onChange: () => void,
  onStatus?: (status: string) => void,
  coupleId?: string
) {
  if (!isSupabaseConfigured) {
    return { unsubscribe: () => undefined }
  }

  let timer: ReturnType<typeof setTimeout> | null = null
  let pending = false
  const scheduleChange = () => {
    pending = true
    if (timer) return
    timer = setTimeout(() => {
      timer = null
      if (!pending) return
      pending = false
      onChange()
    }, 200)
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
      scheduleChange
    )
    .subscribe((status) => {
      onStatus?.(status)
    })

  return {
    unsubscribe: () => {
      if (timer) clearTimeout(timer)
      timer = null
      pending = false
      void supabase.removeChannel(channel)
    },
  }
}
