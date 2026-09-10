import { useEffect, useState } from 'react'
import { Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { addSong, getPlaylist, PlaylistSong, removeSong, toggleAnniversary } from '@/services/music'

function extractId(value: string) {
  const trimmed = value.trim()
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/)
  return match?.[1] ?? (trimmed.match(/^[A-Za-z0-9_-]{11}$/)?.[0] ?? null)
}

export default function MusicScreen() {
  const [songs, setSongs] = useState<PlaylistSong[]>([])
  const [input, setInput] = useState('')
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const reload = async () => { try { setSongs(await getPlaylist()); setError('') } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to load playlist.') } }
  useEffect(() => { void reload() }, [])
  const add = async () => {
    const externalId = extractId(input)
    if (!externalId || !title.trim()) { setError('Enter a YouTube URL or ID and a song title.'); return }
    try { await addSong({ externalId, title: title.trim(), whyAdded: note.trim() }); setInput(''); setTitle(''); setNote(''); await reload() }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to add song.') }
  }
  return <ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.eyebrow}>Music</Text><Text style={styles.title}>Our Playlist</Text>
    <View style={styles.card}><TextInput value={input} onChangeText={setInput} placeholder="YouTube URL or video ID" placeholderTextColor="#8d8d99" style={styles.input} />
      <TextInput value={title} onChangeText={setTitle} placeholder="Song title" placeholderTextColor="#8d8d99" style={styles.input} />
      <TextInput value={note} onChangeText={setNote} placeholder="Why I added this (optional)" placeholderTextColor="#8d8d99" style={styles.input} />
      <TouchableOpacity style={styles.primary} onPress={() => void add()}><Text style={styles.primaryText}>Add song</Text></TouchableOpacity>
    </View>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    {songs.map((song) => <View key={song.id} style={styles.card}><TouchableOpacity onPress={() => void Linking.openURL(`https://www.youtube.com/watch?v=${song.external_id}`)}><Text style={styles.song}>{song.title}</Text><Text style={styles.artist}>{song.artist || 'YouTube'}</Text></TouchableOpacity>
      {song.why_added ? <Text style={styles.note}>“{song.why_added}”</Text> : null}
      <View style={styles.actions}><TouchableOpacity onPress={() => void toggleAnniversary(song.id, !song.is_anniversary_song).then(reload)}><Text style={styles.action}>{song.is_anniversary_song ? '★ Anniversary song' : '☆ Make anniversary song'}</Text></TouchableOpacity><TouchableOpacity onPress={() => void removeSong(song.id).then(reload)}><Text style={styles.delete}>Remove</Text></TouchableOpacity></View>
    </View>)}
  </ScrollView>
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#0f0f12', padding: 20, paddingTop: 72, gap: 14 }, eyebrow: { color: '#d9bfd7', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' }, title: { color: '#f3f0f5', fontSize: 30, fontWeight: '700' }, card: { backgroundColor: '#171b22', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#2a2d35', gap: 10 }, input: { backgroundColor: '#0f0f12', borderRadius: 12, color: '#f3f0f5', padding: 12, borderWidth: 1, borderColor: '#2a2d35' }, primary: { backgroundColor: '#d8b9c8', padding: 13, borderRadius: 12, alignItems: 'center' }, primaryText: { color: '#0f0f12', fontWeight: '800' }, song: { color: '#f3f0f5', fontSize: 18, fontWeight: '700' }, artist: { color: '#c4c4ce' }, note: { color: '#d9bfd7', fontStyle: 'italic' }, actions: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, action: { color: '#d9bfd7', fontWeight: '700' }, delete: { color: '#ff9b9b', fontWeight: '700' }, error: { color: '#ff9b9b' },
})
