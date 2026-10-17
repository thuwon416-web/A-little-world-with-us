/**
 * ChatComposer
 *
 * The message input bar at the bottom of the chat screen, together with
 * the attachment sheet modal and all individual media picker modals
 * (Photo, Voice, File, GIF, Sticker, ReplyThread).
 *
 * Keeping the composer and its modals here reduces the chat screen's JSX
 * surface area by ~130 lines.
 */
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
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { Input } from '@/components/Input'
import { FileUpload } from '@/components/chat/FileUpload'
import { GIFPicker } from '@/components/chat/GIFPicker'
import { PhotoShare } from '@/components/chat/PhotoShare'
import { ReplyThread } from '@/components/chat/ReplyThread'
import { StickerPicker } from '@/components/chat/StickerPicker'
import { VoiceMessageRecorder } from '@/components/chat/VoiceMessageRecorder'
import type { ChatAttachment, NativeChatMessage } from '@/components/chat/chat-types'
import { useTheme } from '@/context/ThemeContext'
import { sizes } from '@/design-tokens'

type MediaModalType = 'photo' | 'voice' | 'file' | 'gif' | 'sticker' | null

export interface ChatComposerProps {
  draft: string
  onDraftChange: (text: string) => void
  onSend: () => void
  onSendLocation: () => Promise<void>
  onSendMedia: (attachment: ChatAttachment, type: 'photo' | 'voice' | 'file' | 'audio', duration?: number) => Promise<void>
  onSendSticker: (emoji: string) => Promise<void>
  onSendGif: (url: string) => Promise<void>
  onSendReply: (text: string, replyTo: string) => Promise<void>
  replyMessage: NativeChatMessage | null
  onCloseReply: () => void
  coupleId: string | null
  currentUserId: string | null
  mediaModal: MediaModalType
  onMediaModalChange: (modal: MediaModalType) => void
  attachmentsOpen: boolean
  onAttachmentsOpenChange: (open: boolean) => void
}

export function ChatComposer({
  draft,
  onDraftChange,
  onSend,
  onSendLocation,
  onSendMedia,
  onSendSticker,
  onSendGif,
  onSendReply,
  replyMessage,
  onCloseReply,
  coupleId,
  currentUserId,
  mediaModal,
  onMediaModalChange,
  attachmentsOpen,
  onAttachmentsOpenChange,
}: ChatComposerProps) {
  const { colors } = useTheme()

  return (
    <>
      <View style={styles.composer}>
        {/* Attachment sheet trigger */}
        <Modal
          visible={attachmentsOpen}
          transparent
          animationType="slide"
          onRequestClose={() => onAttachmentsOpenChange(false)}
        >
          <TouchableOpacity
            style={styles.attachmentOverlay}
            activeOpacity={1}
            onPress={() => onAttachmentsOpenChange(false)}
          >
            <View
              style={[
                styles.attachmentSheet,
                { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.attachmentHeader}>
                <Text style={[styles.attachmentTitle, { color: colors.textPrimary }]}>Attachments</Text>
                <TouchableOpacity
                  onPress={() => onAttachmentsOpenChange(false)}
                  accessibilityLabel="Close attachments"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X color={colors.textSecondary} size={22} />
                </TouchableOpacity>
              </View>
              <View style={styles.attachmentGrid}>
                {([
                  ['Photo', ImageIcon, 'photo'],
                  ['Voice', Mic, 'voice'],
                  ['File', FileText, 'file'],
                  ['GIF', Gift, 'gif'],
                  ['Sticker', Sticker, 'sticker'],
                ] as const).map(([label, Icon, type]) => (
                  <TouchableOpacity
                    key={label}
                    style={[styles.attachmentItem, { backgroundColor: colors.surface }]}
                    onPress={() => {
                      onAttachmentsOpenChange(false)
                      onMediaModalChange(type)
                    }}
                  >
                    <Icon color={colors.accent1} size={20} />
                    <Text style={[styles.attachmentLabel, { color: colors.textPrimary }]}>{label}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.attachmentItem, { backgroundColor: colors.surface }]}
                  onPress={() => {
                    onAttachmentsOpenChange(false)
                    void onSendLocation()
                  }}
                  disabled={!coupleId}
                >
                  <MapPin color={colors.accent1} size={20} />
                  <Text style={[styles.attachmentLabel, { color: colors.textPrimary }]}>Location</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        <TouchableOpacity
          style={[styles.attachmentButton, { backgroundColor: colors.surface }]}
          onPress={() => onAttachmentsOpenChange(true)}
          accessibilityLabel="Open attachments"
          accessibilityRole="button"
          accessibilityHint="Choose a photo, voice note, file, GIF, sticker, or location"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Paperclip color={colors.textSecondary} size={20} />
        </TouchableOpacity>

        <Input
          value={draft}
          onChangeText={onDraftChange}
          placeholder="Write something sweet..."
          style={styles.input}
          accessibilityLabel="Message"
          accessibilityHint="Enter a message to send to your partner"
        />

        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: colors.accent1 }]}
          onPress={() => (draft.trim() ? onSend() : onMediaModalChange('voice'))}
          accessibilityLabel={draft.trim() ? 'Send message' : 'Record voice note'}
        >
          {draft.trim() ? (
            <Send color={colors.accentForeground ?? '#ffffff'} size={18} />
          ) : (
            <Mic color={colors.accentForeground ?? '#ffffff'} size={18} />
          )}
        </TouchableOpacity>
      </View>

      {/* Media pickers */}
      <PhotoShare
        visible={mediaModal === 'photo'}
        onClose={() => onMediaModalChange(null)}
        onPhotoSelect={(photo) => onSendMedia(photo, 'photo')}
      />
      <VoiceMessageRecorder
        visible={mediaModal === 'voice'}
        onClose={() => onMediaModalChange(null)}
        onRecord={({ attachment, duration }) => onSendMedia(attachment, 'voice', duration)}
      />
      <FileUpload
        visible={mediaModal === 'file'}
        onClose={() => onMediaModalChange(null)}
        onFileSelect={(file) =>
          onSendMedia(file, file.mimeType.startsWith('audio/') ? 'audio' : 'file')
        }
      />
      <GIFPicker
        visible={mediaModal === 'gif'}
        onClose={() => onMediaModalChange(null)}
        onSelect={onSendGif}
      />
      <StickerPicker
        visible={mediaModal === 'sticker'}
        onClose={() => onMediaModalChange(null)}
        onSelect={onSendSticker}
      />
      <ReplyThread
        visible={Boolean(replyMessage)}
        message={replyMessage}
        currentUserId={currentUserId}
        onClose={onCloseReply}
        onReply={onSendReply}
      />
    </>
  )
}

const styles = StyleSheet.create({
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  attachmentButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: { flex: 1 },
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
