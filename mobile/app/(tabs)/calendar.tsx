import { Heart, Plane, Star, Target, Home, Trash2 } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { useAuth } from '@/lib/auth'
import {
  getCalendarData,
  getSharedCalendarPreference,
  saveCalendarEvent,
  saveSharedCalendarPreference,
  deleteCalendarEvent,
  type CalendarEvent,
  type CalendarEventType,
} from '@/services/calendar'

const types: CalendarEventType[] = ['date', 'trip', 'goal', 'life', 'other']
const icons = { date: Heart, trip: Plane, goal: Target, life: Home, other: Star }
const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const daysUntil = (date: string) =>
  Math.max(
    0,
    Math.floor(
      (new Date(`${date}T12:00:00`).getTime() - new Date().setHours(12, 0, 0, 0)) / 86400000
    )
  )

export default function CalendarScreen() {
  const { user } = useAuth()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [coupleId, setCoupleId] = useState('')
  const [month, setMonth] = useState(new Date())
  const [shared, setShared] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState<CalendarEvent | null>(null)
  const [editingId, setEditingId] = useState<string>()
  const [title, setTitle] = useState('')
  const [eventDate, setEventDate] = useState(dateKey(new Date()))
  const [description, setDescription] = useState('')
  const [type, setType] = useState<CalendarEventType>('date')
  const [repeat, setRepeat] = useState('')
  const [error, setError] = useState('')
  const load = async () => {
    try {
      const data = await getCalendarData()
      setEvents(data.events)
      setCoupleId(data.coupleId)
      if (user) setShared(await getSharedCalendarPreference(user.id))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load calendar.')
    }
  }
  useEffect(() => {
    void load()
  }, [user?.id])
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const days = new Date(year, monthIndex + 1, 0).getDate()
  const first = new Date(year, monthIndex, 1).getDay()
  const monthEvents = events.filter((event) =>
    event.event_date.startsWith(`${year}-${String(monthIndex + 1).padStart(2, '0')}`)
  )
  const nextEvent = events
    .filter((event) => event.event_date >= dateKey(new Date()))
    .sort((a, b) => a.event_date.localeCompare(b.event_date))[0]
  const save = async () => {
    if (
      !title.trim() ||
      title.trim().length > 100 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(eventDate) ||
      description.length > 500
    ) {
      Alert.alert(
        'Invalid event',
        'Use a title up to 100 characters, a valid YYYY-MM-DD date, and a description up to 500 characters.'
      )
      return
    }
    try {
      await saveCalendarEvent({
        id: editingId,
        coupleId,
        title: title.trim(),
        eventDate,
        description,
        type,
        repeat: repeat || undefined,
      })
      setTitle('')
      setDescription('')
      setEditingId(undefined)
      setShowAdd(false)
      await load()
    } catch (caught) {
      Alert.alert('Unable to save', caught instanceof Error ? caught.message : 'Please try again.')
    }
  }
  const editEvent = (event: CalendarEvent) => {
    setSelected(null)
    setEditingId(event.id)
    setTitle(event.title)
    setEventDate(event.event_date)
    setDescription(event.description ?? '')
    setType(event.type)
    setRepeat(event.repeat ?? '')
    setShowAdd(true)
  }
  const openEvent = (event: CalendarEvent) => setSelected(event)
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>SHARED CALENDAR</Text>
      <Text style={styles.title}>Calendar</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.toolbar}>
        <TouchableOpacity onPress={() => setMonth(new Date(year, monthIndex - 1, 1))}>
          <Text style={styles.nav}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.month}>
          {month.toLocaleDateString([], { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={() => setMonth(new Date(year, monthIndex + 1, 1))}>
          <Text style={styles.nav}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.today} onPress={() => setMonth(new Date())}>
          <Text style={styles.todayText}>Today</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        <Text style={styles.muted}>
          {nextEvent
            ? `${daysUntil(nextEvent.event_date)} days until ${nextEvent.title}`
            : 'No upcoming events'}
        </Text>
        <TouchableOpacity
          onPress={() => {
            const next = !shared
            setShared(next)
            if (user) void saveSharedCalendarPreference(user.id, next)
          }}
        >
          <Text style={styles.link}>{shared ? 'Shared calendar on' : 'Shared calendar off'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.week}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <Text key={`${day}-${index}`} style={styles.weekDay}>
            {day}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {Array.from({ length: first }).map((_, index) => (
          <View key={`empty-${index}`} style={styles.day} />
        ))}
        {Array.from({ length: days }, (_, index) => {
          const day = index + 1
          const date = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayEvents = monthEvents.filter((event) => event.event_date === date)
          return (
            <TouchableOpacity
              key={date}
              style={[styles.day, date === dateKey(new Date()) && styles.todayDay]}
              onPress={() => dayEvents[0] && openEvent(dayEvents[0])}
            >
              <Text style={styles.dayText}>{day}</Text>
              {dayEvents.length ? (
                <View style={styles.dot}>
                  <Text style={styles.dotText}>{dayEvents.length}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          )
        })}
      </View>
      <View style={styles.events}>
        {monthEvents.map((event) => {
          const Icon = icons[event.type] ?? Star
          return (
            <TouchableOpacity key={event.id} style={styles.event} onPress={() => openEvent(event)}>
              <Icon color="#ff9bba" size={18} />
              <View style={styles.eventText}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.muted}>
                  {event.event_date}
                  {event.event_time ? ` · ${event.event_time}` : ''}
                </Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
      <TouchableOpacity style={styles.add} onPress={() => setShowAdd(true)}>
        <Text style={styles.addText}>+ Add event</Text>
      </TouchableOpacity>
      <Modal
        visible={showAdd}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAdd(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add event</Text>
            <View style={styles.typeRow}>
              {types.map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.type, type === value && styles.typeActive]}
                  onPress={() => setType(value)}
                >
                  <Text style={styles.typeText}>{value}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Title"
              placeholderTextColor="#8d8d99"
              style={styles.input}
            />
            <TextInput
              value={eventDate}
              onChangeText={setEventDate}
              placeholder="Date YYYY-MM-DD"
              placeholderTextColor="#8d8d99"
              style={styles.input}
            />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Description (optional)"
              placeholderTextColor="#8d8d99"
              multiline
              style={[styles.input, styles.notes]}
            />
            <View style={styles.typeRow}>
              {['', 'daily', 'weekly', 'monthly', 'yearly'].map((value) => (
                <TouchableOpacity
                  key={value || 'none'}
                  style={[styles.type, repeat === value && styles.typeActive]}
                  onPress={() => setRepeat(value)}
                >
                  <Text style={styles.typeText}>{value || 'No repeat'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.add} onPress={() => void save()}>
              <Text style={styles.addText}>Save event</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Text style={styles.link}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={Boolean(selected)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            {selected ? (
              <>
                <Text style={styles.modalTitle}>{selected.title}</Text>
                <Text style={styles.muted}>
                  {selected.type} · {selected.event_date}
                </Text>
                <Text style={styles.text}>{selected.description || 'No description.'}</Text>
                <TouchableOpacity style={styles.add} onPress={() => editEvent(selected)}>
                  <Text style={styles.addText}>Edit event</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.delete}
                  onPress={() =>
                    Alert.alert('Delete event?', 'This cannot be undone.', [
                      { text: 'Cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                          await deleteCalendarEvent(selected.id)
                          setSelected(null)
                          await load()
                        },
                      },
                    ])
                  }
                >
                  <Trash2 color="#fff" size={16} />
                  <Text style={styles.addText}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSelected(null)}>
                  <Text style={styles.link}>Close</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#0f0f12', padding: 20, paddingTop: 72, gap: 14 },
  eyebrow: { color: '#d9bfd7', letterSpacing: 2, fontSize: 12 },
  title: { color: '#f3f0f5', fontSize: 30, fontWeight: '700' },
  error: { color: '#ff9b9b' },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#171b22',
    borderRadius: 16,
    padding: 10,
  },
  nav: { color: '#ff9bba', fontSize: 32, paddingHorizontal: 12 },
  month: { color: '#fff', fontSize: 17, fontWeight: '800' },
  today: { backgroundColor: '#604582', borderRadius: 10, padding: 8 },
  todayText: { color: '#fff', fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  muted: { color: '#c4c4ce', fontSize: 13 },
  link: { color: '#ff9bba', fontWeight: '700' },
  week: { flexDirection: 'row' },
  weekDay: { width: `${100 / 7}%`, textAlign: 'center', color: '#8d8d99' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  day: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  todayDay: { borderWidth: 2, borderColor: '#ff9bba' },
  dayText: { color: '#f3f0f5' },
  dot: { backgroundColor: '#ff6b81', borderRadius: 8, minWidth: 15, alignItems: 'center' },
  dotText: { color: '#fff', fontSize: 9 },
  events: { gap: 8 },
  event: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#171b22',
    borderRadius: 14,
    padding: 12,
  },
  eventText: { flex: 1 },
  eventTitle: { color: '#fff', fontWeight: '700' },
  add: { backgroundColor: '#ff6b81', padding: 14, borderRadius: 13, alignItems: 'center' },
  addText: { color: '#fff', fontWeight: '800' },
  overlay: { flex: 1, backgroundColor: '#0009', justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: '#171b22', borderRadius: 20, padding: 20, gap: 12 },
  modalTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  type: { padding: 9, backgroundColor: '#2a2d36', borderRadius: 10 },
  typeActive: { backgroundColor: '#ff6b81' },
  typeText: { color: '#fff', fontSize: 12 },
  input: { backgroundColor: '#0f0f12', borderRadius: 11, color: '#fff', padding: 12 },
  notes: { minHeight: 75, textAlignVertical: 'top' },
  text: { color: '#f3f0f5' },
  delete: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8d3b52',
    borderRadius: 11,
    padding: 12,
  },
})
