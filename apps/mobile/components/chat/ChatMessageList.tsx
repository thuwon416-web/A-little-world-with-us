/**
 * ChatMessageList
 *
 * Renders the scrollable list of chat messages using FlatList + ChatBubble.
 * Exposes scroll-to-index via a forwarded ref so the parent screen can jump
 * to a specific message when the user taps a reply context.
 */
import { forwardRef, useCallback } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'

import { ChatBubble, type ChatMessage } from '@/components/ChatBubble'
import type { NativeChatMessage } from '@/components/chat/chat-types'
import { sizes } from '@/design-tokens'
import { useTheme } from '@/context/ThemeContext'

export interface ChatMessageListProps {
  messages: ChatMessage[]
  highlightedMessageId: string | null
  onReply: (message: ChatMessage) => void
  onDelete: (message: ChatMessage) => void
  onEdit: (message: ChatMessage) => void
  onTranscribe: (message: ChatMessage) => void
  onHighlightClear: () => void
  setHighlightedMessageId: (id: string | null) => void
}

export const ChatMessageList = forwardRef<FlatList<ChatMessage>, ChatMessageListProps>(
  function ChatMessageList(
    { messages, highlightedMessageId, onReply, onDelete, onEdit, onTranscribe, setHighlightedMessageId },
    ref
  ) {
    const { colors } = useTheme()

    const renderItem = useCallback(
      ({ item }: { item: ChatMessage }) => (
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
                  const targetIndex = messages.findIndex((candidate) => candidate.id === item.replyTo)
                  if (targetIndex >= 0) {
                    ;(ref as React.RefObject<FlatList<ChatMessage>>).current?.scrollToIndex({
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
          onReply={(selected) => onReply(selected)}
          onDelete={(selected) => onDelete(selected)}
          onEdit={(selected) => onEdit(selected)}
          onTranscribe={(selected) => onTranscribe(selected)}
        />
      ),
      [messages, highlightedMessageId, onReply, onDelete, onEdit, onTranscribe, setHighlightedMessageId, ref]
    )

    return (
      <FlatList
        ref={ref}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={[styles.list, { backgroundColor: colors.surface, borderRadius: sizes.radius.card }]}
        contentContainerStyle={styles.listContent}
        numColumns={1}
        onScrollToIndexFailed={({ index }) =>
          (ref as React.RefObject<FlatList<ChatMessage>>).current?.scrollToOffset({
            offset: Math.max(0, index * 72),
            animated: true,
          })
        }
      />
    )
  }
)

const styles = StyleSheet.create({
  list: {
    flex: 1,
    padding: 16,
  },
  listContent: {
    gap: 12,
  },
})
