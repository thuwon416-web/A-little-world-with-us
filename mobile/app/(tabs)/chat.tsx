import { Q } from '@nozbe/watermelondb'
import * as Location from 'expo-location'
import {
  FileText,
  Gift,
  Image as ImageIcon,
  MapPin,
  Mic,
  Paperclip,
  Send,
  Sticker,
  X,
} from 'lucide-react-native'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ChatBubble, type ChatMessage } from '@/components/ChatBubble'
import { Input } from '@/components/Input'
import { FileUpload } from '@/components/chat/FileUpload'
import { GIFPicker } from '@/components/chat/GIFPicker'
import { PhotoShare } from '@/components/chat/PhotoShare'
import { ReplyThread } from '@/components/chat/ReplyThread'
import { StickerPicker } from '@/components/chat/StickerPicker'
import { VoiceMessageGallery } from '@/components/chat/VoiceMessageGallery'
import { VoiceMessageRecorder } from '@/components/chat/VoiceMessageRecorder'
import type {
  ChatAttachment,
  ChatMessageType,
  NativeChatMessage,
} from '@/components/chat/chat-types'
import type { ThemeColors } from '@/context/ThemeContext'
import { useTheme } from '@/context/ThemeContext'
import { database } from '@/database'
import { sizes, type Sizes } from '@/design-tokens'
import { useCall } from '@/hooks/useCall'
import { useSync } from '@/hooks/useSync'
import { useAuth } from '@/lib/auth'
import { deriveChatKey, decryptMessage, encryptMessage } from '@/lib/chatEncryption'
import { downloadDecryptAndCache, guessMimeTypeFromPath } from '@/lib/mediaEncryption'
import { supabase } from '@/lib/supabase'
import {
  deleteChatMedia,
  getBucketForMimeType,
  getChatMediaUrl,
  uploadChatMedia,
} from '@/services/chatMedia'

function isExternalUrl(value: string | null | undefined): boolean {
  if (!value) return false
  return value.startsWith('http://') || value.startsWith('https://')
}

function formatMessageTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Now'
  }

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  if (diffHours < 24) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function ChatScreen() {
  const { user } = useAuth()
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => createStyles(colors, sizes), [colors])
  const { state: callState, placeCall } = useCall()
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mediaModal, setMediaModal] = useState<
    'photo' | 'voice' | 'file' | 'gif' | 'sticker' | null
  >(null)
  const [attachmentsOpen, setAttachmentsOpen] = useState(false)
  const [replyMessage, setReplyMessage] = useState<NativeChatMessage | null>(null)
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)
  const listRef = useRef<FlatList<ChatMessage>>(null)
  const { status, isOffline, pendingCount, refresh } = useSync(coupleId ?? undefined)

  useEffect(() => {
    const subscription = database
      .get('messages')
      .query(Q.sortBy('created_at', 'asc'))
      .observe()
      .subscribe((records) => {
        void Promise.all(
          records.map(async (record) => {
            const rawRecord = record as unknown as { id: string; _get: (column: string) => unknown }
            const serializedLocation = rawRecord._get('location_payload')
            let location: { latitude: number; longitude: number; accuracy?: number } | null = null
            if (typeof serializedLocation === 'string' && serializedLocation) {
              try {
                location = JSON.parse(serializedLocation) as {
                  latitude: number
                  longitude: number
                  accuracy?: number
                }
              } catch {
                location = null
              }
            }
            const content = rawRecord._get('content')
            const createdAt = rawRecord._get('created_at')
            const messageType = rawRecord._get('message_type')
            const mediaUrl = rawRecord._get('media_url')
            const mediaDuration = rawRecord._get('media_duration')
            const replyTo = rawRecord._get('reply_to')
            const encrypted = rawRecord._get('encrypted')
            const encryptionVersion = rawRecord._get('encryption_version')

            let displayContent = typeof content === 'string' ? content : ''

            // Decrypt if encrypted
            if (encrypted && encryptionVersion && coupleId && typeof content === 'string') {
              try {
                const key = await deriveChatKey(coupleId)
                displayContent = await decryptMessage(content, key, coupleId)
              } catch (error) {
                console.error('Failed to decrypt message:', error)
                displayContent = '[Encrypted message]'
              }
            }

            const normalizedType: ChatMessageType =
              messageType === 'voice' ||
              messageType === 'photo' ||
              messageType === 'sticker' ||
              messageType === 'gif' ||
              messageType === 'file' ||
              messageType === 'video' ||
              messageType === 'audio' ||
              messageType === 'location' ||
              messageType === 'sos'
                ? messageType
                : 'text'
            const bucket =
              normalizedType === 'photo'
                ? 'chat_photos'
                : normalizedType === 'voice' || normalizedType === 'audio'
                  ? 'voice_messages'
                  : normalizedType === 'file'
                    ? 'chat_files'
                    : null
            const resolvedMediaUrl =
              bucket && typeof mediaUrl === 'string'
                ? isExternalUrl(mediaUrl)
                  ? await getChatMediaUrl(bucket, mediaUrl)
                  : coupleId
                    ? await downloadDecryptAndCache(
                        coupleId,
                        bucket,
                        mediaUrl,
                        guessMimeTypeFromPath(mediaUrl)
                      )
                    : await getChatMediaUrl(bucket, mediaUrl)
                : typeof mediaUrl === 'string'
                  ? mediaUrl
                  : null
            return {
              id: rawRecord.id,
              sender: (rawRecord._get('sender_id') === user?.id ? 'me' : 'them') as 'me' | 'them',
              content: displayContent,
              senderId:
                typeof rawRecord._get('sender_id') === 'string'
                  ? (rawRecord._get('sender_id') as string)
                  : '',
              text: displayContent,
              time: formatMessageTime(
                typeof createdAt === 'number'
                  ? new Date(createdAt).toISOString()
                  : new Date().toISOString()
              ),
              type: normalizedType,
              messageType: normalizedType,
              mediaUrl: resolvedMediaUrl,
              mediaPath: typeof mediaUrl === 'string' ? mediaUrl : null,
              mediaDuration: typeof mediaDuration === 'number' ? mediaDuration : null,
              replyTo: typeof replyTo === 'string' ? replyTo : null,
              createdAt:
                typeof createdAt === 'number'
                  ? new Date(createdAt).toISOString()
                  : new Date().toISOString(),
              location,
            }
          })
        ).then((nextMessages) => setMessages(nextMessages))
      })

    return () => subscription.unsubscribe()
  }, [user?.id, coupleId])

  // Fetch the accepted couple link and resolve the partner from its members.
  useEffect(() => {
    const fetchPartnerId = async () => {
      if (!user?.id) return

      try {
        const { data } = await supabase
          .from('couple_links')
          .select('couple_id, inviter_id, accepted_by')
          .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
          .eq('status', 'accepted')
          .single()

        if (data?.couple_id && data.accepted_by) {
          setCoupleId(data.couple_id)
          setPartnerId(data.inviter_id === user.id ? data.accepted_by : data.inviter_id)
        }
      } catch (error) {
        console.error('Error fetching partner ID:', error)
      }
    }

    void fetchPartnerId()
  }, [user?.id])

  const handleSend = async () => {
    const trimmed = draft.trim()
    if (!trimmed || !user?.id || !coupleId) return

    let encryptedContent = trimmed
    let isEncrypted = false
    let encryptionVersion: number | null = null

    // Encrypt text messages
    try {
      const key = await deriveChatKey(coupleId)
      encryptedContent = await encryptMessage(trimmed, key)
      isEncrypted = true
      encryptionVersion = 1
    } catch (error) {
      console.error('Failed to encrypt message:', error)
      // Fall back to plaintext if encryption fails
    }

    await database.write(async () => {
      await database.get('messages').create((record) => {
        const rawRecord = record as unknown as {
          content: string
          sender_id: string
          couple_id: string
          created_at: number
          synced: boolean
          encrypted: boolean
          encryption_version: number | null
        }
        rawRecord.content = encryptedContent
        rawRecord.sender_id = user.id
        rawRecord.couple_id = coupleId
        rawRecord.created_at = Date.now()
        rawRecord.synced = !isOffline
        rawRecord.encrypted = isEncrypted
        rawRecord.encryption_version = encryptionVersion
      })
    })

    setDraft('')

    if (isOffline) {
      return
    }

    try {
      await refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to sync chat.')
    }
  }

  const handleSendLocation = async () => {
    if (!user?.id || !coupleId) return
    const { status: permission } = await Location.requestForegroundPermissionsAsync()
    if (permission !== 'granted') {
      Alert.alert(
        'Location permission needed',
        'Allow location access to send your current map pin.'
      )
      return
    }
    try {
      const point = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const payload = {
        latitude: point.coords.latitude,
        longitude: point.coords.longitude,
        accuracy: point.coords.accuracy ?? undefined,
      }
      await database.write(async () => {
        await database.get('messages').create((record) => {
          const rawRecord = record as unknown as {
            content: string
            sender_id: string
            couple_id: string
            created_at: number
            synced: boolean
            message_type: string
            location_payload: string
          }
          rawRecord.content = 'Shared a location'
          rawRecord.sender_id = user.id
          rawRecord.couple_id = coupleId
          rawRecord.created_at = Date.now()
          rawRecord.message_type = 'location'
          rawRecord.location_payload = JSON.stringify(payload)
          rawRecord.synced = !isOffline
        })
      })
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
    if (insertError || !message)
      throw new Error(insertError?.message || 'Unable to create media message.')
    try {
      const { path, mimeType } = await uploadChatMedia(user.id, coupleId, message.id, attachment)
      const { error: updateError } = await supabase
        .from('messages')
        .update({ media_url: path, media_mime_type: mimeType })
        .eq('id', message.id)
      if (updateError) throw new Error(updateError.message)
      await refresh()
    } catch (caught) {
      await supabase.from('messages').delete().eq('id', message.id).eq('sender_id', user.id)
      throw caught
    }
  }

  const sendSticker = async (emoji: string) => {
    if (!user?.id || !coupleId) throw new Error('Connect to your partner before sending stickers.')
    const { error: insertError } = await supabase.from('messages').insert({
      couple_id: coupleId,
      sender_id: user.id,
      content: emoji,
      message_type: 'sticker',
      encrypted: false,
    })
    if (insertError) throw new Error(insertError.message)
    setMediaModal(null)
    await refresh()
  }

  const sendGif = async (url: string) => {
    if (!user?.id || !coupleId) throw new Error('Connect to your partner before sending GIFs.')
    const { error: insertError } = await supabase.from('messages').insert({
      couple_id: coupleId,
      sender_id: user.id,
      media_url: url,
      message_type: 'gif',
      encrypted: false,
    })
    if (insertError) throw new Error(insertError.message)
    setMediaModal(null)
    await refresh()
  }

  const sendReply = async (text: string, replyTo: string) => {
    if (!user?.id || !coupleId) throw new Error('Connect to your partner before replying.')
    const { error: insertError } = await supabase.from('messages').insert({
      couple_id: coupleId,
      sender_id: user.id,
      content: text,
      message_type: 'text',
      reply_to: replyTo,
      encrypted: false,
    })
    if (insertError) throw new Error(insertError.message)
    await refresh()
  }

  const deleteMessage = async (message: ChatMessage) => {
    if (!user?.id || message.senderId !== user.id) return
    if (
      message.mediaPath &&
      (message.messageType === 'photo' ||
        message.messageType === 'voice' ||
        message.messageType === 'audio' ||
        message.messageType === 'file')
    ) {
      const bucket = getBucketForMimeType(
        message.messageType === 'photo'
          ? 'image/*'
          : message.messageType === 'voice' || message.messageType === 'audio'
            ? 'audio/*'
            : 'application/octet-stream'
      )
      await deleteChatMedia(bucket, message.mediaPath)
    }
    const { error: deleteError } = await supabase
      .from('messages')
      .delete()
      .eq('id', message.id)
      .eq('sender_id', user.id)
    if (deleteError) setError(deleteError.message)
    else await refresh()
  }

  const handleCall = (type: 'audio' | 'video') => {
    if (!partnerId) {
      console.error('Partner ID not found')
      return
    }

    void placeCall(partnerId, type)
  }

  const statusLabel = isOffline
    ? 'Offline'
    : status === 'syncing'
      ? 'Syncing...'
      : status === 'error'
        ? 'Sync error'
        : 'Synced'

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Chat</Text>
      {error && <Text style={styles.error}>{error}</Text>}

      <View style={[styles.syncBanner, isOffline ? styles.offline : styles.online]}>
        <Text style={styles.syncText}>{statusLabel}</Text>
        {pendingCount > 0 && <Text style={styles.syncText}>• {pendingCount} pending</Text>}
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatBubble
            message={item}
            highlighted={item.id === highlightedMessageId}
            replyPreview={
              item.replyTo
                ? messages.find((candidate) => candidate.id === item.replyTo)?.text
                : undefined
            }
            onReplyContext={
              item.replyTo
                ? () => {
                    const targetIndex = messages.findIndex(
                      (candidate) => candidate.id === item.replyTo
                    )
                    if (targetIndex >= 0) {
                      listRef.current?.scrollToIndex({
                        index: targetIndex,
                        animated: true,
                        viewPosition: 0.5,
                      })
                      setHighlightedMessageId(item.replyTo ?? null)
                      setTimeout(() => setHighlightedMessageId(null), 1800)
                    }
                  }
                : undefined
            }
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
          />
        )}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        numColumns={1}
        onScrollToIndexFailed={({ index }) =>
          listRef.current?.scrollToOffset({ offset: Math.max(0, index * 72), animated: true })
        }
      />
      <VoiceMessageGallery messages={messages} />

      <View style={styles.callRow}>
        <TouchableOpacity
          style={[styles.callButton, !partnerId && styles.callButtonDisabled]}
          onPress={() => handleCall('audio')}
          disabled={!partnerId}
          accessibilityRole="button"
          accessibilityLabel="Start audio call"
          accessibilityHint="Calls your partner using audio"
        >
          <Text style={styles.callButtonText}>Audio call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.callButtonVideo, !partnerId && styles.callButtonDisabled]}
          onPress={() => handleCall('video')}
          disabled={!partnerId}
          accessibilityRole="button"
          accessibilityLabel="Start video call"
          accessibilityHint="Calls your partner using video"
        >
          <Text style={styles.callButtonText}>Video call</Text>
        </TouchableOpacity>
      </View>

      {callState !== 'idle' && <Text style={styles.callStatus}>Call status: {callState}</Text>}

      <View style={styles.composer}>
        <Modal
          visible={attachmentsOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setAttachmentsOpen(false)}
        >
          <TouchableOpacity
            style={styles.attachmentOverlay}
            activeOpacity={1}
            onPress={() => setAttachmentsOpen(false)}
          >
            <View
              style={[
                styles.attachmentSheet,
                { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.attachmentHeader}>
                <Text style={[styles.attachmentTitle, { color: colors.textPrimary }]}>
                  Attachments
                </Text>
                <TouchableOpacity
                  onPress={() => setAttachmentsOpen(false)}
                  accessibilityLabel="Close attachments"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X color={colors.textSecondary} size={22} />
                </TouchableOpacity>
              </View>
              <View style={styles.attachmentGrid}>
                {[
                  ['Photo', ImageIcon, 'photo'],
                  ['Voice', Mic, 'voice'],
                  ['File', FileText, 'file'],
                  ['GIF', Gift, 'gif'],
                  ['Sticker', Sticker, 'sticker'],
                ].map(([label, Icon, type]) => (
                  <TouchableOpacity
                    key={label as string}
                    style={[styles.attachmentItem, { backgroundColor: colors.surface }]}
                    onPress={() => {
                      setAttachmentsOpen(false)
                      setMediaModal(type as typeof mediaModal)
                    }}
                  >
                    <Icon color={colors.accent1} size={20} />
                    <Text style={[styles.attachmentLabel, { color: colors.textPrimary }]}>
                      {label as string}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.attachmentItem, { backgroundColor: colors.surface }]}
                  onPress={() => {
                    setAttachmentsOpen(false)
                    void handleSendLocation()
                  }}
                  disabled={!coupleId}
                >
                  <MapPin color={colors.accent1} size={20} />
                  <Text style={[styles.attachmentLabel, { color: colors.textPrimary }]}>
                    Location
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
        <TouchableOpacity
          style={[styles.attachmentButton, { backgroundColor: colors.surface }]}
          onPress={() => setAttachmentsOpen(true)}
          accessibilityLabel="Open attachments"
          accessibilityRole="button"
          accessibilityHint="Choose a photo, voice note, file, GIF, sticker, or location"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Paperclip color={colors.textSecondary} size={20} />
        </TouchableOpacity>
        <Input
          value={draft}
          onChangeText={setDraft}
          placeholder="Write something sweet..."
          style={styles.input}
          accessibilityLabel="Message"
          accessibilityHint="Enter a message to send to your partner"
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: colors.accent1 }]}
          onPress={() => (draft.trim() ? void handleSend() : setMediaModal('voice'))}
          accessibilityLabel={draft.trim() ? 'Send message' : 'Record voice note'}
        >
          {draft.trim() ? (
            <Send color={colors.background} size={18} />
          ) : (
            <Mic color={colors.background} size={18} />
          )}
        </TouchableOpacity>
      </View>
      <PhotoShare
        visible={mediaModal === 'photo'}
        onClose={() => setMediaModal(null)}
        onPhotoSelect={(photo) => sendMediaMessage(photo, 'photo')}
      />
      <VoiceMessageRecorder
        visible={mediaModal === 'voice'}
        onClose={() => setMediaModal(null)}
        onRecord={({ attachment, duration }) => sendMediaMessage(attachment, 'voice', duration)}
      />
      <FileUpload
        visible={mediaModal === 'file'}
        onClose={() => setMediaModal(null)}
        onFileSelect={(file) =>
          sendMediaMessage(file, file.mimeType.startsWith('audio/') ? 'audio' : 'file')
        }
      />
      <GIFPicker
        visible={mediaModal === 'gif'}
        onClose={() => setMediaModal(null)}
        onSelect={sendGif}
      />
      <StickerPicker
        visible={mediaModal === 'sticker'}
        onClose={() => setMediaModal(null)}
        onSelect={sendSticker}
      />
      <ReplyThread
        visible={Boolean(replyMessage)}
        message={replyMessage}
        currentUserId={user?.id ?? null}
        onClose={() => setReplyMessage(null)}
        onReply={sendReply}
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
    title: {
      color: colors.textPrimary,
      fontSize: sizes.text.hLg,
      fontWeight: '700',
      marginBottom: 12,
    },
    syncBanner: {
      flexDirection: 'row',
      gap: 8,
      borderRadius: sizes.radius.input,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginBottom: 12,
    },
    online: {
      backgroundColor: colors.surface,
    },
    offline: {
      backgroundColor: colors.surface,
    },
    syncText: {
      color: colors.textPrimary,
      fontSize: sizes.text.xs,
      fontWeight: '600',
    },
    list: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.card,
      padding: 16,
    },
    listContent: {
      gap: 12,
    },
    callRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 12,
    },
    callButton: {
      flex: 1,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.accent1,
      borderRadius: sizes.radius.input,
      paddingVertical: 12,
      alignItems: 'center',
    },
    callButtonVideo: {
      flex: 1,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.accent1,
      borderRadius: sizes.radius.input,
      paddingVertical: 12,
      alignItems: 'center',
    },
    callButtonDisabled: {
      opacity: 0.5,
    },
    callButtonText: {
      color: colors.textPrimary,
      fontWeight: '700',
    },
    callStatus: {
      color: colors.accent2,
      fontSize: sizes.text.xs,
      marginBottom: 10,
    },
    composer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 16,
    },
    attachmentButton: {
      width: 44,
      height: 44,
      borderRadius: sizes.radius.btn,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: sizes.radius.btn,
      alignItems: 'center',
      justifyContent: 'center',
    },
    input: {
      flex: 1,
    },
    error: { color: colors.error, marginBottom: 8, fontSize: sizes.text.sm },
    attachmentOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008' },
    attachmentSheet: {
      borderTopWidth: 1,
      borderTopLeftRadius: sizes.radius.panel,
      borderTopRightRadius: sizes.radius.panel,
      padding: 20,
    },
    attachmentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    attachmentTitle: { fontSize: sizes.text.hSm, fontWeight: '700' },
    attachmentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    attachmentItem: {
      width: '30%',
      minHeight: 72,
      borderRadius: sizes.radius.btn,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    attachmentLabel: { fontSize: sizes.text.xs, fontWeight: '600' },
  })
