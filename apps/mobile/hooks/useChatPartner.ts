/**
 * useChatPartner
 *
 * Fetches the accepted couple link, resolves the partner ID, loads both user
 * and partner profiles, and returns the pinned message (if any).
 *
 * Keeps all Supabase profile/couple queries out of the chat screen so the
 * screen only receives the data it needs to render.
 */
import { useEffect, useState } from 'react'

import type { ChatMessage } from '@/components/ChatBubble'
import { supabase } from '@/lib/supabase'

type Profile = { full_name: string | null; avatar_url: string | null }

export interface ChatPartnerState {
  partnerId: string | null
  coupleId: string | null
  userProfile: Profile | null
  partnerProfile: Profile | null
  pinnedMessage: ChatMessage | null
  /** Call to dismiss the pinned message banner locally. */
  clearPinnedMessage: () => void
}

/**
 * Resolves the current user's couple link and partner profiles from Supabase.
 * Also fetches the most-recently pinned message for the couple.
 *
 * @param userId  - The authenticated user's ID
 * @param messages - The live message list (used to resolve pinned message preview)
 */
export function useChatPartner(userId: string | undefined, messages: ChatMessage[]): ChatPartnerState {
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null)
  const [pinnedMessage, setPinnedMessage] = useState<ChatMessage | null>(null)

  useEffect(() => {
    if (!userId) return

    const fetchPartner = async () => {
      try {
        const { data } = await supabase
          .from('couple_links')
          .select('couple_id, inviter_id, accepted_by')
          .or(`inviter_id.eq.${userId},accepted_by.eq.${userId}`)
          .eq('status', 'accepted')
          .single()

        if (!data?.couple_id || !data.accepted_by) return

        setCoupleId(data.couple_id)
        const pId = data.inviter_id === userId ? data.accepted_by : data.inviter_id
        setPartnerId(pId)

        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', [userId, pId])

        if (profs) {
          const me = profs.find((p) => p.id === userId)
          const partner = profs.find((p) => p.id === pId)
          if (me) setUserProfile(me)
          if (partner) setPartnerProfile(partner)
        }

        // Fetch pinned message separately — failure is non-fatal
        try {
          const { data: pinnedRow } = await supabase
            .from('chat_pinned_messages')
            .select('message_id')
            .eq('couple_id', data.couple_id)
            .order('pinned_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (pinnedRow?.message_id) {
            const matched = messages.find((m) => m.id === pinnedRow.message_id)
            if (matched) setPinnedMessage(matched)
          }
        } catch {
          // Pinned message is optional — swallow silently
        }
      } catch (error) {
        console.error('Error fetching partner ID:', error)
      }
    }

    void fetchPartner()
  }, [userId]) // intentionally excludes `messages` to avoid re-fetching on every message

  return {
    partnerId,
    coupleId,
    userProfile,
    partnerProfile,
    pinnedMessage,
    clearPinnedMessage: () => setPinnedMessage(null),
  }
}
