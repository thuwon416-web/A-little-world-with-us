import { Play, Sparkles, Star } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@/context/ThemeContext'
import type { ThemeColors } from '@/context/ThemeContext'
import { sizes, type Sizes } from '@/design-tokens'
import { addSong, getPlaylist, PlaylistSong, removeSong, toggleAnniversary } from '@/services/music'

type MusicTab = 'playlist' | 'mood'

const moodBoard = [
  {
    id: 'romantic',
    label: 'Soft & romantic',
    description: 'Warm songs for slow evenings and close conversations.',
    tracks: [
      {
        youtubeId: '450p7goxZqg',
        title: 'Kiss Me',
        artist: 'Sixpence None the Richer',
        duration: '3:30',
      },
      { youtubeId: '3JWTaaS7LdU', title: 'All of Me', artist: 'John Legend', duration: '4:29' },
      {
        youtubeId: 'lp-EO5I60KA',
        title: 'Thinking Out Loud',
        artist: 'Ed Sheeran',
        duration: '4:41',
      },
    ],
  },
  {
    id: 'happy',
    label: 'Bright & happy',
    description: 'A little lift for dancing in the kitchen together.',
    tracks: [
      { youtubeId: 'ZbZSe6N_BXs', title: 'Happy', artist: 'Pharrell Williams', duration: '3:53' },
      {
        youtubeId: 'OPf0YbXqDm0',
        title: 'Uptown Funk',
        artist: 'Mark Ronson ft. Bruno Mars',
        duration: '4:30',
      },
      {
        youtubeId: 'ru0K8uYEZWw',
        title: 'Can’t Stop the Feeling!',
        artist: 'Justin Timberlake',
        duration: '4:01',
      },
    ],
  },
  {
    id: 'chill',
    label: 'Slow & chill',
    description: 'Low-key soundtracks for quiet mornings and rainy days.',
    tracks: [
      {
        youtubeId: '5qap5aO4i9A',
        title: 'lofi hip hop radio',
        artist: 'Lofi Girl',
        duration: 'Live',
      },
      {
        youtubeId: 'DWcJFNfaw9c',
        title: 'Coffee shop radio',
        artist: 'Chillhop Music',
        duration: 'Live',
      },
      {
        youtubeId: 'hHW1oY26kxQ',
        title: 'Peaceful Piano',
        artist: 'Soothing Relaxation',
        duration: 'Live',
      },
    ],
  },
  {
    id: 'sad',
    label: 'Tender & sad',
    description: 'Gentle songs for naming and holding difficult feelings.',
    tracks: [
      {
        youtubeId: 'RgKAFK5djSk',
        title: 'See You Again',
        artist: 'Wiz Khalifa ft. Charlie Puth',
        duration: '3:58',
      },
      { youtubeId: 'hLQl3WQQoQ0', title: 'Someone Like You', artist: 'Adele', duration: '4:45' },
      { youtubeId: 'YQHsXMglC9A', title: 'Hello', artist: 'Adele', duration: '4:55' },
    ],
  },
] as const

function extractId(value: string) {
  const trimmed = value.trim()
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/
  )
  return match?.[1] ?? trimmed.match(/^[A-Za-z0-9_-]{11}$/)?.[0] ?? null
}

export default function MusicScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => createStyles(colors, sizes), [colors])
  const [tab, setTab] = useState<MusicTab>('playlist')
  const [songs, setSongs] = useState<PlaylistSong[]>([])
  const [input, setInput] = useState('')
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const reload = async () => {
    try {
      setSongs(await getPlaylist())
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load playlist.')
    }
  }
  useEffect(() => {
    void reload()
  }, [])
  const add = async () => {
    const externalId = extractId(input)
    if (!externalId || !title.trim()) {
      setError('Enter a YouTube URL or ID and a song title.')
      return
    }
    try {
      await addSong({ externalId, title: title.trim(), whyAdded: note.trim() })
      setInput('')
      setTitle('')
      setNote('')
      await reload()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to add song.')
    }
  }
  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <Text style={[styles.eyebrow, { color: colors.accent2 }]}>Music</Text>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Sounds for us</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Keep the songs that feel like you two close at hand.
      </Text>

      <View
        style={[styles.tabs, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
      >
        {(
          [
            ['playlist', 'Our Playlist'],
            ['mood', 'Mood Board'],
          ] as const
        ).map(([value, label]) => (
          <TouchableOpacity
            key={value}
            style={[styles.tab, tab === value && { backgroundColor: colors.accent1 }]}
            onPress={() => setTab(value)}
          >
            <Text
              style={[
                styles.tabText,
                { color: tab === value ? colors.background : colors.textSecondary },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'playlist' ? (
        <>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
            ]}
          >
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="YouTube URL or video ID"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  color: colors.textPrimary,
                  backgroundColor: colors.background,
                  borderColor: colors.cardBorder,
                },
              ]}
            />
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Song title"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  color: colors.textPrimary,
                  backgroundColor: colors.background,
                  borderColor: colors.cardBorder,
                },
              ]}
            />
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Why I added this (optional)"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  color: colors.textPrimary,
                  backgroundColor: colors.background,
                  borderColor: colors.cardBorder,
                },
              ]}
            />
            <TouchableOpacity
              style={[styles.primary, { backgroundColor: colors.accent1 }]}
              onPress={() => void add()}
            >
              <Text style={[styles.primaryText, { color: colors.background }]}>Add song</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
          {songs.map((song) => (
            <View
              key={song.id}
              style={[
                styles.card,
                { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              ]}
            >
              <TouchableOpacity
                onPress={() =>
                  void Linking.openURL(`https://www.youtube.com/watch?v=${song.external_id}`)
                }
              >
                <Text style={[styles.song, { color: colors.textPrimary }]}>{song.title}</Text>
                <Text style={[styles.artist, { color: colors.textSecondary }]}>
                  {song.artist || 'YouTube'}
                </Text>
              </TouchableOpacity>
              {song.why_added ? (
                <Text style={[styles.note, { color: colors.accent2 }]}>“{song.why_added}”</Text>
              ) : null}
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() =>
                    void toggleAnniversary(song.id, !song.is_anniversary_song).then(reload)
                  }
                >
                  <View style={styles.actionRow}>
                    <Star
                      color={colors.accent2}
                      fill={song.is_anniversary_song ? colors.accent2 : 'none'}
                      size={16}
                    />
                    <Text style={[styles.action, { color: colors.accent2 }]}>
                      {song.is_anniversary_song ? 'Anniversary song' : 'Make anniversary song'}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => void removeSong(song.id).then(reload)}>
                  <Text style={[styles.delete, { color: colors.error }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </>
      ) : (
        <>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
            ]}
          >
            <View style={styles.moodHeading}>
              <Sparkles color={colors.accent1} size={18} />
              <Text style={[styles.moodTitle, { color: colors.textPrimary }]}>
                Find the right feeling
              </Text>
            </View>
            <Text style={[styles.artist, { color: colors.textSecondary }]}>
              A few starting points for your next shared moment.
            </Text>
          </View>
          {moodBoard.map((mood) => (
            <View
              key={mood.id}
              style={[
                styles.card,
                { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              ]}
            >
              <Text style={[styles.song, { color: colors.textPrimary }]}>{mood.label}</Text>
              <Text style={[styles.artist, { color: colors.textSecondary }]}>
                {mood.description}
              </Text>
              <View style={styles.moodTracks}>
                {mood.tracks.map((track) => (
                  <TouchableOpacity
                    key={track.youtubeId}
                    hitSlop={{ top: 7, bottom: 7, left: 7, right: 7 }}
                    style={[
                      styles.track,
                      { backgroundColor: colors.surface, borderColor: colors.cardBorder },
                    ]}
                    onPress={() =>
                      void Linking.openURL(`https://www.youtube.com/watch?v=${track.youtubeId}`)
                    }
                  >
                    <View style={[styles.playIcon, { backgroundColor: colors.accent1 }]}>
                      <Play color={colors.background} fill={colors.background} size={12} />
                    </View>
                    <View style={styles.trackDetails}>
                      <Text
                        style={[styles.trackTitle, { color: colors.textPrimary }]}
                        numberOfLines={1}
                      >
                        {track.title}
                      </Text>
                      <Text
                        style={[styles.artist, { color: colors.textSecondary }]}
                        numberOfLines={1}
                      >
                        {track.artist}
                      </Text>
                    </View>
                    <Text style={[styles.duration, { color: colors.textSecondary }]}>
                      {track.duration}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  )
}
const createStyles = (colors: ThemeColors, sizes: Sizes) =>
  StyleSheet.create({
    container: { flexGrow: 1, padding: 20, gap: 14 },
    eyebrow: { fontSize: sizes.text.xs, letterSpacing: 2, textTransform: 'uppercase' },
    title: { fontSize: sizes.text.hLg, fontWeight: '700' },
    subtitle: { fontSize: sizes.text.sm, lineHeight: 21 },
    tabs: {
      flexDirection: 'row',
      borderRadius: sizes.radius.btn,
      borderWidth: 1,
      padding: 4,
      gap: 4,
    },
    tab: { flex: 1, paddingVertical: 11, borderRadius: sizes.radius.input, alignItems: 'center' },
    tabText: { fontWeight: '700' },
    card: {
      borderRadius: sizes.radius.card,
      padding: 16,
      borderWidth: 1,
      gap: 10,
    },
    input: {
      borderRadius: sizes.radius.input,
      padding: 12,
      borderWidth: 1,
    },
    primary: { padding: 13, borderRadius: sizes.radius.input, alignItems: 'center' },
    primaryText: { fontWeight: '800' },
    song: { fontSize: sizes.text.bodyLg, fontWeight: '700' },
    artist: {},
    note: { fontStyle: 'italic' },
    actions: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    actionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    action: { fontWeight: '700' },
    delete: { fontWeight: '700' },
    error: {},
    moodHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    moodTitle: { fontSize: sizes.text.body, fontWeight: '700' },
    moodTracks: { gap: 8, marginTop: 4 },
    track: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderRadius: sizes.radius.btn,
      borderWidth: 1,
      padding: 10,
    },
    playIcon: {
      width: 30,
      height: 30,
      borderRadius: sizes.radius.btn,
      alignItems: 'center',
      justifyContent: 'center',
    },
    trackDetails: { flex: 1, minWidth: 0 },
    trackTitle: { fontSize: sizes.text.sm, fontWeight: '600' },
    duration: { fontSize: sizes.text.xs },
  })
