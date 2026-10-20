/**
 * ChatScreen
 *
 * Main chat tab. Presentation logic only — all heavy work is delegated to
 * focused sub-modules:
 *
 *  - `hooks/useChatMessages`  — WatermelonDB subscription + decryption
 *  - `hooks/useChatPartner`   — couple link + profile resolution
 *  - `components/chat/ChatMessageList` — FlatList + ChatBubble
 *  - `components/chat/ChatComposer`    — input bar + all media modals
 */
import { useRouter } from 'expo-router'
import { Image as ImageIcon, Pin, X } from 'lucide-react-native'
import { useMemo, useRef, useState } from 'react'
import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ChatBubble, type ChatMessage } from '@/components/ChatBubble'
import { ConnectedCoupleAvatars } from '@/components/ConnectedCoupleAvatars'
import { Card } from '@/components/ui/Card'
import { IncomingCall } from '@/components/IncomingCall'
import { VoiceMessageGallery } from '@/components/chat/VoiceMessageGallery'
import { ChatComposer } from '@/components/chat/ChatComposer'
import { ChatMessageList } from '@/components/chat/ChatMessageList'
import type { ChatAttachment, NativeChatMessage } from '@/components/chat/chat-types'
import type { ThemeColors } from '@/context/ThemeContext'
import { useTheme } from '@/context/ThemeContext'
import { database } from '@/database'
import { sizes, type Sizes } from '@/design-tokens'
import { useCall } from '@/hooks/useCall'
import { useSync } from '@/hooks/useSync'
import { useChatMessages } from '@/hooks/useChatMessages'
import { useChatPartner } from '@/hooks/useChatPartner'
import { useAuth } from '@/lib/auth'
import { deriveChatKey, encryptMessage } from '@/lib/chatEncryption'
import { supabase } from '@/lib/supabase'
import { deleteChatMedia, getBucketForMimeType, uploadChatMedia } from '@/services/chatMedia'

// ---------------------------------------------------------------------------
// Helper types used only inside this screen
// ---------------------------------------------------------------------------

type RawChatRecord = { id: string; _get: (column: string) => unknown }

type PreparedTextMessage = {
  content: string
  encrypted: boolean
  encryptionVersion: number | null
}

type MessageLocation = { latitude: number; longitude: number; accuracy?: number }

// ---------------------------------------------------------------------------
// Message persistence helpers (screen-level only; DB logic belongs to hooks)
// ---------------------------------------------------------------------------

async function prepareTextMessage(content: string, coupleId: string): Promise<PreparedTextMessage> {
  // Encryption failures must abort the send — never silently fall back to plaintext.
  // Catching here and returning { encrypted: false } would silently break E2E guarantees.
  const key = await deriveChatKey(coupleId)
  const encrypted = await encryptMessage(content, key)
  return { content: encrypted, encrypted: true, encryptionVersion: 1 }
}

async function persistTextMessage(
  userId: string,
  coupleId: string,
  message: PreparedTextMessage,
  synced: boolean
): Promise<void> {
  try {
    await database.write(async () => {
      await database.get('messages').create((record) => {
        const raw = record as unknown as {
          _raw: { id: string }; content: string; sender_id: string
          couple_id: string; created_at: number; synced: boolean
          encrypted: boolean; encryption_version: number | null
        }
        raw._raw.id = crypto.randomUUID()
        raw.content = message.content
        raw.sender_id = userId
        raw.couple_id = coupleId
        raw.created_at = Date.now()
        raw.synced = synced
        raw.encrypted = message.encrypted
        raw.encryption_version = message.encryptionVersion
      })
    })
  } catch (err) {
    // Re-throw so the caller (handleSend) can surface the error to the user
    throw new Error(`Failed to save message locally: ${err instanceof Error ? err.message : String(err)}`)
  }
}

async function persistLocationMessage(
  userId: string,
  coupleId: string,
  payload: MessageLocation,
  synced: boolean
): Promise<void> {
  await database.write(async () => {
    await database.get('messages').create((record) => {
      const raw = record as unknown as {
        _raw: { id: string }; content: string; sender_id: string
        couple_id: string; created_at: number; synced: boolean
        message_type: string; location_payload: string
      }
      raw._raw.id = crypto.randomUUID()
      raw.content = 'Shared a location'
      raw.sender_id = userId
      raw.couple_id = coupleId
      raw.created_at = Date.now()
      raw.message_type = 'location'
      raw.location_payload = JSON.stringify(payload)
      raw.synced = synced
    })
  })
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ChatScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => createStyles(colors, sizes), [colors])
  const { state: callState, placeCall, incomingSignal, acceptCall, rejectCall } = useCall()

  // ---------- Composer state ----------
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [mediaModal, setMediaModal] = useState<'photo' | 'voice' | 'file' | 'gif' | 'sticker' | null>(null)
  const [attachmentsOpen, setAttachmentsOpen] = useState(false)
  const [replyMessage, setReplyMessage] = useState<NativeChatMessage | null>(null)

  // ---------- Edit message state ----------
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const listRef = useRef<FlatList<ChatMessage>>(null)

  // ---------- Data hooks ----------
  // useChatPartner resolves coupleId from the couple table; useChatMessages subscribes
  // to local DB for the given coupleId. Pass coupleId from useChatPartner to avoid
  // subscribing with null and decrypting messages before the key is available.
  const { partnerId, coupleId, userProfile, partnerProfile, pinnedMessage, clearPinnedMessage } =
    useChatPartner(user?.id)
  const messages = useChatMessages(user?.id, coupleId ?? null)
  const { status, isOffline, pendingCount, refresh } = useSync(coupleId ?? undefined)

  // ---------- Send handlers ----------

  const handleSend = async () => {
    const trimmed = draft.trim()
    if (!trimmed || !user?.id || !coupleId) return
    try {
      const message = await prepareTextMessage(trimmed, coupleId)
      await persistTextMessage(user.id, coupleId, message, false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.')
      return
    }
    setDraft('')
    if (isOffline) return
    try { await refresh() } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sync chat.')
    }
  }

  const handleSendLocation = async () => {
    if (!user?.id || !coupleId) return
    // Lazy-import expo-location to avoid requiring location permission at app startup
    const Location = await import('expo-location')
    const { status: permission } = await Location.requestForegroundPermissionsAsync()
    if (permission !== 'granted') {
      Alert.alert('Location permission needed', 'Allow location access to send your current map pin.')
      return
    }
    try {
      const point = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      await persistLocationMessage(user.id, coupleId, {
        latitude: point.coords.latitude,
        longitude: point.coords.longitude,
        accuracy: point.coords.accuracy ?? undefined,
      }, false)
      if (!isOffline) await refresh()
    } catch {
      Alert.alert('Could not get location', 'Check GPS and try again.')
    }
  }

  const sendMediaMessage = async (
    attachment: ChatAttachment,
    messageType: 'photo' | 'voice' | 'file' | 'audio',
    duration?: number
  ) => {
    if (!user?.id || !coupleId) throw new Error('Connect to your partner before sending media.')
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        couple_id: coupleId,
        sender_id: user.id,
        message_type: messageType,
        media_duration: duration ?? null,
        content: messageType === 'file' ? attachment.name : null,
        encrypted: false,
      })
      .select('id')
      .single()
    if (insertError || !message) throw new Error(insertError?.message || 'Unable to create media message.')
    try {
      const { path, mimeType, storageProvider, storageFileId, storagePath } =
        await uploadChatMedia(user.id, coupleId, message.id, attachment)
      const { error: updateError } = await supabase
        .from('messages')
        .update({
          media_url: path,
          media_mime_type: mimeType,
          media_storage_provider: storageProvider,
          media_storage_file_id: storageFileId,
          media_storage_path: storagePath,
          media_size_bytes: attachment.size ?? null,
        })
        .eq('id', message.id)
      if (updateError) throw new Error(updateError.message)
      await refresh()
    } catch (error_) {
      await supabase.from('messages').delete().eq('id', message.id).eq('sender_id', user.id)
      throw error_
    }
  }

  const sendSticker = async (emoji: string) => {
    if (!user?.id || !coupleId) throw new Error('Connect to your partner before sending stickers.')
    const { error: insertError } = await supabase.from('messages').insert({
      couple_id: coupleId, sender_id: user.id, content: emoji, message_type: 'sticker', encrypted: false,
    })
    if (insertError) throw new Error(insertError.message)
    setMediaModal(null)
    await refresh()
  }

  const sendGif = async (url: string) => {
    if (!user?.id || !coupleId) throw new Error('Connect to your partner before sending GIFs.')
    const { error: insertError } = await supabase.from('messages').insert({
      couple_id: coupleId, sender_id: user.id, media_url: url, message_type: 'gif', encrypted: false,
    })
    if (insertError) throw new Error(insertError.message)
    setMediaModal(null)
    await refresh()
  }

  const sendReply = async (text: string, replyTo: string) => {
    if (!user?.id || !coupleId) throw new Error('Connect to your partner before replying.')
    const { error: insertError } = await supabase.from('messages').insert({
      couple_id: coupleId, sender_id: user.id, content: text,
      message_type: 'text', reply_to: replyTo, encrypted: false,
    })
    if (insertError) throw new Error(insertError.message)
    await refresh()
  }

  const transcribeMessage = async (message: ChatMessage) => {
    if (!message.mediaUrl || !message.id) return
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const webUrl = process.env.EXPO_PUBLIC_WEB_URL
      if (!webUrl || !session?.access_token) throw new Error('Please sign in again.')
      const media = await fetch(message.mediaUrl)
      if (!media.ok) throw new Error('Unable to read this voice message.')
      const blob = await media.blob()
      const form = new FormData()
      form.append('audio', blob as unknown as Blob, 'voice-message.webm')
      form.append('messageId', message.id)
      const response = await fetch(`${webUrl.replace(/\/$/, '')}/api/ai/transcribe`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: form,
      })
      const body = (await response.json()) as { transcript?: string; error?: string }
      if (!response.ok || !body.transcript) throw new Error(body.error || 'Unable to transcribe this voice message.')
      const local = await database.get('messages').find(message.id)
      await database.write(async () => {
        await local.update((record) => {
          const raw = record as unknown as { transcript: string | null; synced: boolean }
          raw.transcript = body.transcript ?? null
          raw.synced = true
        })
      })
      await refresh()
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Unable to transcribe this voice message.')
    }
  }

  const editMessage = async () => {
    if (!editingMessage || !user?.id || !coupleId || !editDraft.trim()) return
    setEditSaving(true)
    try {
      const key = await deriveChatKey(coupleId)
      const encryptedContent = await encryptMessage(editDraft.trim(), key)
      const editedAt = new Date().toISOString()
      const local = await database.get('messages').find(editingMessage.id)
      if (isOffline) {
        await database.write(async () => {
          await local.update((record) => {
            const raw = record as unknown as { content: string; edited_at: string | null; synced: boolean }
            raw.content = encryptedContent; raw.edited_at = editedAt; raw.synced = false
          })
        })
      } else {
        const { error: updateError } = await supabase
          .from('messages')
          .update({ content: encryptedContent, edited_at: editedAt })
          .eq('id', editingMessage.id)
          .eq('sender_id', user.id)
        if (updateError) throw updateError
        await database.write(async () => {
          await local.update((record) => {
            const raw = record as unknown as { content: string; edited_at: string | null; synced: boolean }
            raw.content = encryptedContent; raw.edited_at = editedAt; raw.synced = true
          })
        })
        await refresh()
      }
      setEditingMessage(null); setEditDraft('')
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Unable to edit message.')
    } finally {
      setEditSaving(false)
    }
  }

  const deleteMessage = async (message: ChatMessage) => {
    if (!user?.id || message.senderId !== user.id) return
    const deletedAt = new Date().toISOString()
    if (isOffline) {
      try {
        const local = await database.get('messages').find(message.id)
        await database.write(async () => {
          await local.update((record) => {
            const raw = record as unknown as { deleted_at: string | null; synced: boolean }
            raw.deleted_at = deletedAt; raw.synced = false
          })
        })
        await refresh()
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : 'Unable to delete message offline.')
      }
      return
    }
    // Keep the message row authoritative before removing its media. If media deletion
    // fails, the chat record remains recoverable and can be cleaned up later.
    const { error: deleteError } = await supabase
      .from('messages')
      .update({ deleted_at: deletedAt })
      .eq('id', message.id)
      .eq('sender_id', user.id)
    if (deleteError) { setError(deleteError.message); return }
    try {
      const localRecord = await database.get('messages').find(message.id) as unknown as RawChatRecord
      const storedProvider = localRecord._get('media_storage_provider')
      if (
        message.mediaPath && storedProvider !== 'google_drive' &&
        (message.messageType === 'photo' || message.messageType === 'voice' ||
         message.messageType === 'audio' || message.messageType === 'file')
      ) {
        const bucket = getBucketForMimeType(
          message.messageType === 'photo' ? 'image/*'
            : message.messageType === 'voice' || message.messageType === 'audio' ? 'audio/*'
            : 'application/octet-stream'
        )
        await deleteChatMedia(bucket, message.mediaPath)
      }
    } catch {
      // Preserve the deleted message row even if media cleanup is temporarily unavailable.
    }
    try {
      const local = await database.get('messages').find(message.id)
      await database.write(async () => local.markAsDeleted())
    } catch {
      // The remote soft-delete is authoritative; a later sync will reconcile local state.
    }
    await refresh()
  }

  const handleCall = (type: 'audio' | 'video') => {
    if (!partnerId) { console.error('Partner ID not found'); return }
    void placeCall(partnerId, type)
  }

  const statusLabel = isOffline ? 'Offline'
    : status === 'syncing' ? 'Syncing…'
    : status === 'error' ? 'Sync failed'
    : 'Synced'

  const callStateLabel =
    callState === 'calling' ? 'Requesting call'
    : callState === 'ringing' ? 'Incoming call'
    : callState === 'in_call' ? 'Call accepted'
    : callState === 'ended' ? 'Call ended'
    : callState === 'rejected' ? 'Call rejected'
    : ''

  // ---------- Render ----------

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <ConnectedCoupleAvatars
            size="sm"
            userAvatarUrl={userProfile?.avatar_url}
            partnerAvatarUrl={partnerProfile?.avatar_url}
            userName={userProfile?.full_name ?? 'You'}
            partnerName={partnerProfile?.full_name ?? 'Your love'}
          />
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.title, { color: colors.textPrimary, marginBottom: 0 }]} numberOfLines={1}>
              {partnerProfile?.full_name ?? 'Your love'}
            </Text>
            <Text style={[styles.subtitle, { color: isOffline ? colors.textSecondary : '#10b981' }]}>
              {statusLabel}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.galleryButton, { backgroundColor: colors.accent1 + '20', borderColor: colors.accent1 + '40' }]}
            onPress={() => router.push('/memories')}
            accessibilityRole="button"
            accessibilityLabel="View gallery"
          >
            <ImageIcon size={15} color={colors.accent1} />
            <Text style={[styles.galleryButtonText, { color: colors.textPrimary }]}>Gallery</Text>
          </TouchableOpacity>
        </View>

        {pinnedMessage && (
          <TouchableOpacity
            style={[styles.pinnedBanner, { backgroundColor: colors.accent1 + '15', borderColor: colors.accent1 + '35' }]}
            onPress={() => {
              setHighlightedMessageId(pinnedMessage.id)
              setTimeout(() => setHighlightedMessageId(null), 2500)
            }}
          >
            <View style={styles.pinnedLeft}>
              <View style={styles.pinnedTitleRow}>
                <Pin size={11} color={colors.accent1} fill={colors.accent1} />
                <Text style={[styles.pinnedKicker, { color: colors.accent1 }]}>PINNED MESSAGE</Text>
              </View>
              <Text style={[styles.pinnedPreview, { color: colors.textPrimary }]} numberOfLines={1}>
                {pinnedMessage.text || 'Photo or attachment'}
              </Text>
            </View>
            <TouchableOpacity onPress={clearPinnedMessage} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={15} color={colors.textSecondary} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      </Card>

      <IncomingCall
        visible={callState === 'ringing' && Boolean(incomingSignal)}
        signal={incomingSignal}
        onAccept={() => void acceptCall()}
        onReject={() => void rejectCall()}
      />
      {error && <Text style={styles.error}>{error}</Text>}

      <View style={[styles.syncBanner, isOffline ? styles.offline : styles.online]}>
        <Text style={styles.syncText}>{statusLabel}</Text>
        {pendingCount > 0 && <Text style={styles.syncText}>• {pendingCount} pending</Text>}
      </View>

      {/* Message list */}
      <ChatMessageList
        ref={listRef}
        messages={messages}
        highlightedMessageId={highlightedMessageId}
        setHighlightedMessageId={setHighlightedMessageId}
        onHighlightClear={() => setHighlightedMessageId(null)}
        onReply={(selected) =>
          setReplyMessage({
            id: selected.id,
            senderId: selected.senderId,
            content: selected.text,
            messageType: selected.messageType,
            mediaUrl: selected.mediaUrl,
            mediaDuration: selected.mediaDuration,
            replyTo: selected.replyTo,
            createdAt: selected.createdAt,
            mediaPath: selected.mediaPath,
          })
        }
        onDelete={(selected) => void deleteMessage(selected)}
        onEdit={(selected) => { setEditingMessage(selected); setEditDraft(selected.text) }}
        onTranscribe={(selected) => void transcribeMessage(selected)}
      />

      <VoiceMessageGallery messages={messages} />

      {/* Edit message modal */}
      <Modal
        visible={Boolean(editingMessage)}
        transparent
        animationType="fade"
        onRequestClose={() => { if (!editSaving) { setEditingMessage(null); setEditDraft('') } }}
      >
        <View style={styles.editOverlay}>
          <View style={[styles.editModal, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Text style={[styles.editTitle, { color: colors.textPrimary }]}>Edit message</Text>
            <TextInput
              value={editDraft}
              onChangeText={setEditDraft}
              multiline
              autoFocus
              style={[styles.editInput, { color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
            />
            <View style={styles.editButtons}>
              <TouchableOpacity disabled={editSaving} onPress={() => { setEditingMessage(null); setEditDraft('') }}>
                <Text style={styles.linkText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={editSaving || !editDraft.trim()} onPress={() => void editMessage()}>
                <Text style={styles.saveEditText}>{editSaving ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Call controls */}
      <View style={styles.callRow}>
        <TouchableOpacity
          style={[styles.callButton, !partnerId && styles.callButtonDisabled]}
          onPress={() => handleCall('audio')}
          disabled={!partnerId}
          accessibilityRole="button"
          accessibilityLabel="Start audio call"
          accessibilityHint="Call your partner with audio"
        >
          <Text style={styles.callButtonText}>Audio call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.callButtonVideo, !partnerId && styles.callButtonDisabled]}
          onPress={() => handleCall('video')}
          disabled={!partnerId}
          accessibilityRole="button"
          accessibilityLabel="Start video call"
          accessibilityHint="Call your partner with video"
        >
          <Text style={styles.callButtonText}>Video call</Text>
        </TouchableOpacity>
      </View>
      {callState !== 'idle' && (
        <Text style={styles.callStatus}>Call status — {callStateLabel}</Text>
      )}

      {/* Composer (input + attachment sheet + all media modals) */}
      <ChatComposer
        draft={draft}
        onDraftChange={setDraft}
        onSend={() => void handleSend()}
        onSendLocation={handleSendLocation}
        onSendMedia={sendMediaMessage}
        onSendSticker={sendSticker}
        onSendGif={sendGif}
        onSendReply={sendReply}
        replyMessage={replyMessage}
        onCloseReply={() => setReplyMessage(null)}
        coupleId={coupleId}
        currentUserId={user?.id ?? null}
        mediaModal={mediaModal}
        onMediaModalChange={setMediaModal}
        attachmentsOpen={attachmentsOpen}
        onAttachmentsOpenChange={setAttachmentsOpen}
      />
    </View>
  )
}

const createStyles = (colors: ThemeColors, sizes: Sizes) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: 72,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    headerCard: { marginBottom: 8 },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: sizes.space.sm,
    },
    headerTitleWrap: { flex: 1, marginLeft: sizes.space.xs },
    galleryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: sizes.radius.pill,
      borderWidth: 1,
    },
    galleryButtonText: { fontSize: sizes.text.xs, fontWeight: '600' },
    pinnedBanner: {
      marginTop: sizes.space.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: sizes.space.sm,
      paddingVertical: sizes.space.xs,
      borderRadius: sizes.radius.input,
      borderWidth: 1,
    },
    pinnedLeft: { flex: 1, marginRight: sizes.space.xs },
    pinnedTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    pinnedKicker: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    pinnedPreview: { fontSize: sizes.text.xs, marginTop: 2 },
    subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    title: { color: colors.textPrimary, fontSize: sizes.text.hLg, fontWeight: '700', marginBottom: 12 },
    syncBanner: {
      flexDirection: 'row',
      gap: 8,
      borderRadius: sizes.radius.input,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginBottom: 12,
    },
    online: { backgroundColor: colors.surface },
    offline: { backgroundColor: colors.surface },
    syncText: { color: colors.textPrimary, fontSize: sizes.text.xs, fontWeight: '600' },
    callRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    callButton: {
      flex: 1, backgroundColor: 'transparent', borderWidth: 1,
      borderColor: colors.accent1, borderRadius: sizes.radius.input, paddingVertical: 12, alignItems: 'center',
    },
    callButtonVideo: {
      flex: 1, backgroundColor: 'transparent', borderWidth: 1,
      borderColor: colors.accent1, borderRadius: sizes.radius.input, paddingVertical: 12, alignItems: 'center',
    },
    callButtonDisabled: { opacity: 0.5 },
    callButtonText: { color: colors.textPrimary, fontWeight: '700' },
    callStatus: { color: colors.accent2, fontSize: sizes.text.xs, marginBottom: 10 },
    error: { color: colors.error, marginBottom: 8, fontSize: sizes.text.sm },
    editOverlay: { flex: 1, backgroundColor: '#0008', justifyContent: 'center', padding: 20 },
    editModal: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 14 },
    editTitle: { fontSize: sizes.text.hSm, fontWeight: '800' },
    editInput: { minHeight: 110, borderWidth: 1, borderRadius: 12, padding: 12, textAlignVertical: 'top' },
    editButtons: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 18 },
    linkText: { color: colors.textSecondary, fontWeight: '700' },
    saveEditText: { color: colors.accent1, fontWeight: '800' },
  })
