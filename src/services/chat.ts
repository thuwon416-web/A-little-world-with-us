import { supabase } from '@/lib/supabase'
import type { ChatMessage } from '@/shared-types'

export const chatService = {
  async getByCouple(coupleId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase.from('messages').select('id, couple_id, sender_id, content, message_type, media_url, media_duration, reply_to, transcript, location_payload, encrypted, created_at, updated_at').eq('couple_id', coupleId).order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as ChatMessage[]
  },
  async create(message: Omit<ChatMessage, 'id' | 'created_at' | 'updated_at'>): Promise<ChatMessage> {
    const { data, error } = await supabase.from('messages').insert(message).select().single()
    if (error) throw error
    return data as ChatMessage
  },
}
