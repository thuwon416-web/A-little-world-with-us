import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '@/context/ThemeContext'
import { decryptCredential } from '@/lib/vault-crypto'
import type { VaultCredential } from '@/services/vault-credentials'

const weakPassword = (value: string) =>
  value.length < 12 ||
  !/[0-9]/.test(value) ||
  !/[^A-Za-z0-9]/.test(value) ||
  /(1234|password|qwerty|abcd)/i.test(value)
export default function PasswordHealth({
  credentials,
  masterKey,
  onFocus,
}: {
  credentials: VaultCredential[]
  masterKey: Uint8Array
  onFocus: (ids: string[]) => void
}) {
  const { colors: themeColors } = useTheme()
  const colors = { ...themeColors, text: themeColors.textPrimary, muted: themeColors.textSecondary }
  const [counts, setCounts] = useState({
    weak: 0,
    reused: 0,
    old: 0,
    secure: 0,
    weakIds: [] as string[],
    reusedIds: [] as string[],
    oldIds: [] as string[],
  })
  useEffect(() => {
    let active = true
    void Promise.all(
      credentials.map(async (item) => ({
        item,
        data: (await decryptCredential(item.encryptedPayload, item.encryptionIv, masterKey)) as {
          password?: string
        },
      }))
    )
      .then((values) => {
        if (!active) return
        const grouped = new Map<string, string[]>()
        values.forEach(({ item, data }) =>
          grouped.set(data.password ?? '', [...(grouped.get(data.password ?? '') ?? []), item.id])
        )
        const reusedIds = [...grouped.values()].filter((ids) => ids.length > 1).flat()
        const weakIds = values
          .filter(({ data }) => weakPassword(data.password ?? ''))
          .map(({ item }) => item.id)
        const oldIds = credentials
          .filter(
            (item) => Date.now() - new Date(item.updatedAt).getTime() > 365 * 24 * 60 * 60 * 1000
          )
          .map((item) => item.id)
        const issueIds = new Set([...weakIds, ...reusedIds, ...oldIds])
        setCounts({
          weak: weakIds.length,
          reused: reusedIds.length,
          old: oldIds.length,
          secure: credentials.length - issueIds.size,
          weakIds,
          reusedIds,
          oldIds,
        })
      })
      .catch(() =>
        setCounts({
          weak: credentials.length,
          reused: 0,
          old: 0,
          secure: 0,
          weakIds: credentials.map((item) => item.id),
          reusedIds: [],
          oldIds: [],
        })
      )
    return () => {
      active = false
    }
  }, [credentials, masterKey])
  const score = credentials.length ? Math.round((counts.secure / credentials.length) * 100) : 100
  return (
    <View
      style={[styles.container, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
    >
      <View style={styles.scoreRow}>
        <View style={[styles.ring, { borderColor: colors.accent1 }]}>
          <Text style={{ color: colors.text, fontSize: 20 }}>{score}</Text>
        </View>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Password health</Text>
          <Text style={{ color: colors.muted }}>
            {counts.secure} of {credentials.length} secure
          </Text>
        </View>
      </View>
      <View style={styles.grid}>
        {[
          ['Weak', counts.weak, counts.weakIds],
          ['Reused', counts.reused, counts.reusedIds],
          ['Old', counts.old, counts.oldIds],
        ].map(([label, count, ids]) => (
          <Pressable
            key={label as string}
            onPress={() => onFocus(ids as string[])}
            style={[styles.item, { backgroundColor: colors.surface }]}
          >
            <Text style={{ color: colors.muted }}>{label as string}</Text>
            <Text style={{ color: colors.text, fontSize: 20 }}>{count as number}</Text>
            <Text style={{ color: colors.accent1 }}>Fix</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}
const styles = StyleSheet.create({
  container: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 14 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ring: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '700' },
  grid: { flexDirection: 'row', gap: 8, marginTop: 14 },
  item: { flex: 1, borderRadius: 12, padding: 10 },
})
