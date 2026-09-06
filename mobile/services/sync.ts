import { Q } from '@nozbe/watermelondb'

import { database } from '@/database'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'

// Helper function to get authenticated user ID
async function getUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser()
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
      .select('id')
      .or(`inviter_id.eq.${userId},accepted_by.eq.${userId}`)
      .eq('status', 'accepted')
      .single()
    
    if (error || !data) {
      return null
    }
    return data.id
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
    const rawMessage = message as any
    const payload = {
      id: rawMessage.id,
      content: rawMessage._get('content'),
      sender_id: rawMessage._get('sender_id'),
      couple_id: rawMessage._get('couple_id') || coupleId,
      created_at: rawMessage._get('created_at'),
      message_type: rawMessage._get('message_type') || 'text',
      location_payload: (() => {
        const value = rawMessage._get('location_payload')
        try { return value ? JSON.parse(value) : null } catch { return null }
      })(),
    }

    const { error } = await supabase.from('messages').upsert(payload).select()

    if (!error) {
      await database.write(async () => {
        await rawMessage.update((record: any) => {
          record.synced = true
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
  const userId = await getUserId()
  
  // Get couple ID for filtering
  const coupleId = await getCoupleId()

  // Fetch messages with pagination
  let allMessages: any[] = []
  let page = 0
  const pageSize = 100

  while (true) {
    let query = supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1)

    // Filter by couple ID if available
    if (coupleId) {
      query = query.eq('couple_id', coupleId)
    }

    // Filter by last sync time if provided
    if (lastSyncAt) {
      query = query.gte('created_at', lastSyncAt)
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
      const messageIds = allMessages.map(msg => msg.id)
      
      // Batch fetch existing messages to avoid N+1 queries
      const existingMessages = await database
        .get('messages')
        .query(Q.where('id', Q.oneOf(messageIds)))
        .fetch()
      
      const existingMap = new Map(
        (existingMessages as any[]).map(msg => [msg.id, msg])
      )

      // Process each remote message
      for (const remoteMessage of allMessages) {
        const localMessage = existingMap.get(remoteMessage.id)

        if (!localMessage) {
          // Create new message
          await database.get('messages').create((record: any) => {
            record.content = remoteMessage.content ?? ''
            record.sender_id = remoteMessage.sender_id ?? 'unknown'
            record.couple_id = remoteMessage.couple_id ?? ''
            record.created_at = remoteMessage.created_at ?? new Date().toISOString()
            record.message_type = remoteMessage.message_type ?? 'text'
            record.location_payload = remoteMessage.location_payload ? JSON.stringify(remoteMessage.location_payload) : ''
            record.synced = true
          })
        } else {
          // Update existing message if remote is newer
          const localCreatedAt = localMessage._get('created_at') ?? ''
          if ((remoteMessage.created_at ?? '') > localCreatedAt) {
            await localMessage.update((record: any) => {
            record.content = remoteMessage.content ?? record.content
            record.sender_id = remoteMessage.sender_id ?? record.sender_id
            record.couple_id = remoteMessage.couple_id ?? record.couple_id
            record.created_at = remoteMessage.created_at ?? record.created_at
            record.message_type = remoteMessage.message_type ?? record.message_type
            record.location_payload = remoteMessage.location_payload ? JSON.stringify(remoteMessage.location_payload) : record.location_payload
              record.synced = true
            })
          }
        }
      }
    })
  }

  const pending = await pushPendingMessages()
  return { synced: allMessages.length, pending }
}

export function subscribeToChanges(onChange: () => void) {
  if (!isSupabaseConfigured) {
    return { unsubscribe: () => undefined }
  }

  const channel = supabase
    .channel('mobile-chat-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
      onChange()
    })
    .subscribe()

  return {
    unsubscribe: () => {
      void supabase.removeChannel(channel)
    },
  }
}
