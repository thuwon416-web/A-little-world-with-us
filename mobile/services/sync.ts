import { Q } from '@nozbe/watermelondb'
import { database } from '@/database'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'

export async function countPendingMessages() {
  const pending = await database.get('messages').query(Q.where('synced', false)).fetch()
  return pending.length
}

export async function pushPendingMessages() {
  if (!isSupabaseConfigured) {
    return 0
  }

  const pending = await database.get('messages').query(Q.where('synced', false)).fetch()

  for (const message of pending) {
    const rawMessage = message as any
    const payload = {
      id: rawMessage.id,
      content: rawMessage._get('content'),
      sender_id: rawMessage._get('sender_id'),
      created_at: rawMessage._get('created_at'),
    }

    const { error } = await supabase.from('chat_messages').upsert(payload).select()

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

export async function syncMessages() {
  if (!isSupabaseConfigured) {
    const pending = await countPendingMessages()
    return { synced: 0, pending }
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  if (data) {
    await database.write(async () => {
      for (const remoteMessage of data) {
        const matches = await database
          .get('messages')
          .query(Q.where('id', remoteMessage.id))
          .fetch()

        if (matches.length === 0) {
          await database.get('messages').create((record: any) => {
            record.content = remoteMessage.content ?? ''
            record.sender_id = remoteMessage.sender_id ?? 'unknown'
            record.created_at = remoteMessage.created_at ?? new Date().toISOString()
            record.synced = true
          })
          continue
        }

        const localMessage = matches[0] as any
        const localCreatedAt = localMessage._get('created_at') ?? ''
        if ((remoteMessage.created_at ?? '') > localCreatedAt) {
          await localMessage.update((record: any) => {
            record.content = remoteMessage.content ?? record.content
            record.sender_id = remoteMessage.sender_id ?? record.sender_id
            record.created_at = remoteMessage.created_at ?? record.created_at
            record.synced = true
          })
        }
      }
    })
  }

  const pending = await pushPendingMessages()
  return { synced: data?.length ?? 0, pending }
}

export function subscribeToChanges(onChange: () => void) {
  if (!isSupabaseConfigured) {
    return { unsubscribe: () => undefined }
  }

  const channel = supabase
    .channel('mobile-chat-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'chat_messages' },
      () => {
        onChange()
      },
    )
    .subscribe()

  return {
    unsubscribe: () => {
      void supabase.removeChannel(channel)
    },
  }
}
