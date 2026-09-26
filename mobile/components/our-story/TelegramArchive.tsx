import * as DocumentPicker from 'expo-document-picker'
import * as Crypto from 'expo-crypto'
import * as FileSystem from 'expo-file-system'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { useTheme } from '@/context/ThemeContext'
import { sizes } from '@/design-tokens'
import { supabase } from '@/lib/supabase'
import { parseTelegramExport, type TelegramImportRow } from '@/lib/telegram-export'

type ImportedMessage = Pick<TelegramImportRow, 'message_date' | 'sender_name' | 'message_text'> & {
  id: string
}
const PAGE_SIZE = 50
const BATCH_SIZE = 500

export default function TelegramArchive({ coupleId }: { coupleId: string }) {
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const [preview, setPreview] = useState<TelegramImportRow[]>([])
  const [fileName, setFileName] = useState('')
  const [messages, setMessages] = useState<ImportedMessage[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(
    async (offset = 0) => {
      if (!offset) setLoading(true)
      setError('')
      try {
        const { data, error: queryError } = await supabase
          .from('telegram_memories')
          .select('id,message_date,sender_name,message_text')
          .eq('couple_id', coupleId)
          .order('message_date', { ascending: false })
          .range(offset, offset + PAGE_SIZE)
        if (queryError) throw queryError
        const page = (data ?? []) as ImportedMessage[]
        setHasMore(page.length > PAGE_SIZE)
        setMessages((current) =>
          offset ? [...current, ...page.slice(0, PAGE_SIZE)] : page.slice(0, PAGE_SIZE)
        )
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Unable to load Telegram messages.')
      } finally {
        setLoading(false)
      }
    },
    [coupleId]
  )

  useEffect(() => {
    void load()
  }, [load])

  const chooseFile = async () => {
    setError('')
    setNotice('')
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      })
      if (result.canceled || !result.assets[0]) return
      const file = result.assets[0]
      if (file.size && file.size > 100 * 1024 * 1024)
        throw new Error('Choose a file smaller than 100 MB.')
      const content = await FileSystem.readAsStringAsync(file.uri)
      setPreview(parseTelegramExport(JSON.parse(content)))
      setFileName(file.name)
    } catch (caught) {
      setPreview([])
      setFileName('')
      setError(caught instanceof Error ? caught.message : 'Unable to read this file.')
    }
  }

  const importFile = async () => {
    setBusy(true)
    setError('')
    try {
      const batchId = `${Date.now()}-${Crypto.randomUUID()}`
      for (let offset = 0; offset < preview.length; offset += BATCH_SIZE) {
        const batch = preview
          .slice(offset, offset + BATCH_SIZE)
          .map((row) => ({ ...row, couple_id: coupleId, batch_id: batchId }))
        const { error: insertError } = await supabase.from('telegram_memories').upsert(batch, {
          onConflict: 'couple_id,message_date,sender_name,message_text',
          ignoreDuplicates: true,
        })
        if (insertError) throw insertError
      }
      setNotice(
        `Imported ${preview.length} unique text messages. Existing duplicates were skipped.`
      )
      setPreview([])
      setFileName('')
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Import failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Telegram chat archive</Text>
      <Text style={styles.muted}>
        Select a Telegram JSON export. Messages are previewed before saving to your shared space.
      </Text>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => void chooseFile()}
        disabled={busy}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Choose JSON file</Text>
      </TouchableOpacity>
      {fileName ? (
        <View style={styles.preview}>
          <Text style={styles.heading}>{fileName}</Text>
          <Text style={styles.muted}>{preview.length} messages ready to import</Text>
          {preview.slice(0, 3).map((item, index) => (
            <Text key={`${item.message_date}-${index}`} numberOfLines={2} style={styles.message}>
              {item.sender_name}: {item.message_text}
            </Text>
          ))}
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => void importFile()}
            disabled={busy}
            style={[styles.button, styles.primary]}
          >
            {busy ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.primaryText}>Import messages</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
      {notice ? (
        <Text accessibilityRole="alert" style={styles.success}>
          {notice}
        </Text>
      ) : null}
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <Text style={styles.heading}>Imported messages</Text>
      {loading ? (
        <ActivityIndicator color={colors.accent1} />
      ) : (
        messages.map((item) => (
          <View key={item.id} style={styles.messageCard}>
            <View style={styles.row}>
              <Text style={styles.heading}>{item.sender_name}</Text>
              <Text style={styles.date}>{new Date(item.message_date).toLocaleString()}</Text>
            </View>
            <Text style={styles.message}>{item.message_text}</Text>
          </View>
        ))
      )}
      {hasMore ? (
        <TouchableOpacity
          accessibilityRole="button"
          disabled={loading}
          onPress={() => void load(messages.length)}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Load more</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: { gap: 12, paddingBottom: 28 },
    heading: { color: colors.textPrimary, fontSize: sizes.text.bodyLg, fontWeight: '700' },
    muted: { color: colors.textSecondary, lineHeight: 21 },
    button: {
      alignItems: 'center',
      borderColor: colors.cardBorder,
      borderRadius: sizes.radius.input,
      borderWidth: 1,
      padding: 12,
    },
    buttonText: { color: colors.textPrimary, fontWeight: '600' },
    primary: { backgroundColor: colors.accent1, borderColor: colors.accent1, marginTop: 8 },
    primaryText: { color: colors.background, fontWeight: '700' },
    preview: {
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.card,
      gap: 8,
      padding: 14,
    },
    messageCard: {
      backgroundColor: colors.surface,
      borderColor: colors.cardBorder,
      borderRadius: sizes.radius.card,
      borderWidth: 1,
      gap: 8,
      padding: 14,
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 8,
    },
    date: { color: colors.textSecondary, fontSize: sizes.text.xs },
    message: { color: colors.textPrimary, lineHeight: 22 },
    success: { color: colors.success },
    error: { color: colors.error },
  })
