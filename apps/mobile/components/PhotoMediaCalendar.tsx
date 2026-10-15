import { ChevronLeft, ChevronRight, X, Image as ImageIcon } from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { useTheme } from '@/context/ThemeContext'
import type { ThemeColors } from '@/context/ThemeContext'
import { sizes, type Sizes } from '@/design-tokens'
import { supabase } from '@/lib/supabase'

export interface CalendarPhoto {
  id: string
  url: string
  date: string // YYYY-MM-DD
  caption?: string | null
}

interface PhotoMediaCalendarProps {
  coupleId?: string | null
}

function formatDateKey(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
}

export default function PhotoMediaCalendar({ coupleId }: PhotoMediaCalendarProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors, sizes), [colors])
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [photos, setPhotos] = useState<CalendarPhoto[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [activePhoto, setActivePhoto] = useState<CalendarPhoto | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const loadMonthPhotos = useCallback(async () => {
    if (!coupleId) return

    try {
      const startOfMonth = new Date(year, month, 1)
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59)
      const startIso = startOfMonth.toISOString().slice(0, 10)
      const endIso = endOfMonth.toISOString().slice(0, 10)

      const collected: CalendarPhoto[] = []

      // 1. Fetch memories with images
      const { data: memoryRows } = await supabase
        .from('memories')
        .select('id, date, media_url, caption, title')
        .eq('couple_id', coupleId)
        .gte('date', startIso)
        .lte('date', endIso)

      if (memoryRows) {
        for (const m of memoryRows) {
          if (m.media_url) {
            collected.push({
              id: m.id,
              url: m.media_url,
              date: String(m.date).slice(0, 10),
              caption: m.caption || m.title || null,
            })
          }
        }
      }

      // 2. Fetch photo messages
      const { data: chatRows } = await supabase
        .from('messages')
        .select('id, media_url, created_at, content')
        .eq('couple_id', coupleId)
        .eq('message_type', 'photo')
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString())
        .is('deleted_at', null)

      if (chatRows) {
        for (const c of chatRows) {
          if (c.media_url) {
            collected.push({
              id: c.id,
              url: c.media_url,
              date: c.created_at.slice(0, 10),
              caption: c.content || null,
            })
          }
        }
      }

      setPhotos(collected)
    } catch (err) {
      console.warn('Failed to load calendar photos:', err)
    }
  }, [coupleId, year, month])

  useEffect(() => {
    void loadMonthPhotos()
  }, [loadMonthPhotos])

  const photosByDate = useMemo(() => {
    const map = new Map<string, CalendarPhoto[]>()
    for (const p of photos) {
      const list = map.get(p.date) ?? []
      list.push(p)
      map.set(p.date, list)
    }
    return map
  }, [photos])

  const calendarGrid = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay()
    const offset = (firstDayIndex + 6) % 7 // Monday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const cells: { day: number | null; dateKey: string | null }[] = []
    for (let i = 0; i < offset; i++) {
      cells.push({ day: null, dateKey: null })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, dateKey: formatDateKey(year, month, d) })
    }
    while (cells.length % 7 !== 0) {
      cells.push({ day: null, dateKey: null })
    }
    return cells
  }, [year, month])

  const monthLabel = useMemo(() => {
    return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
  }, [currentDate])

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDate(null)
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDate(null)
  }

  const selectedPhotos = useMemo(() => {
    if (!selectedDate) return []
    return photosByDate.get(selectedDate) ?? []
  }, [selectedDate, photosByDate])

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.monthTitle}>{monthLabel}</Text>
        <View style={styles.headerControls}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.arrowButton}>
            <ChevronLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNextMonth} style={styles.arrowButton}>
            <ChevronRight size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Weekday Labels */}
      <View style={styles.weekdaysRow}>
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
          <Text key={d} style={styles.weekdayText}>
            {d}
          </Text>
        ))}
      </View>

      {/* Days Grid */}
      <View style={styles.grid}>
        {calendarGrid.map((cell, idx) => {
          if (!cell.day || !cell.dateKey) {
            return <View key={`empty-${idx}`} style={styles.cell} />
          }

          const dayPhotos = photosByDate.get(cell.dateKey) ?? []
          const hasPhoto = dayPhotos.length > 0
          const isSelected = selectedDate === cell.dateKey

          return (
            <TouchableOpacity
              key={cell.dateKey}
              style={styles.cell}
              onPress={() => setSelectedDate(hasPhoto ? cell.dateKey : null)}
              activeOpacity={0.7}
            >
              {hasPhoto ? (
                <View style={[styles.photoBubble, isSelected && styles.photoBubbleSelected]}>
                  <Image source={{ uri: dayPhotos[0].url }} style={styles.bubbleImage} />
                  <View style={styles.bubbleOverlay} />
                  <Text style={styles.photoDayText}>{cell.day}</Text>
                </View>
              ) : (
                <View style={styles.emptyDayCircle}>
                  <Text style={styles.dayText}>{cell.day}</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Selected Day Photos Strip */}
      {selectedDate && selectedPhotos.length > 0 && (
        <View style={styles.selectedSection}>
          <View style={styles.selectedHeader}>
            <Text style={styles.selectedTitle}>Photos on {selectedDate}</Text>
            <TouchableOpacity onPress={() => setSelectedDate(null)}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoStrip}>
            {selectedPhotos.map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => setActivePhoto(p)}
                style={styles.stripThumbnailWrap}
              >
                <Image source={{ uri: p.url }} style={styles.stripThumbnail} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Full Photo Modal */}
      <Modal visible={Boolean(activePhoto)} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setActivePhoto(null)}
          >
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
          {activePhoto ? (
            <View style={styles.modalContent}>
              <Image
                source={{ uri: activePhoto.url }}
                style={styles.modalImage}
                resizeMode="contain"
              />
              {activePhoto.caption && (
                <Text style={styles.modalCaption}>{activePhoto.caption}</Text>
              )}
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  )
}

function createStyles(colors: ThemeColors, sizes: Sizes) {
  return StyleSheet.create({
    wrapper: {
      backgroundColor: colors.cardBg,
      borderRadius: sizes.radius.panel,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: sizes.space.md,
      marginVertical: sizes.space.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: sizes.space.sm,
    },
    monthTitle: {
      fontSize: sizes.text.hMd,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    headerControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sizes.space.xs,
    },
    arrowButton: {
      padding: sizes.space.xs,
      borderRadius: sizes.radius.btn,
      backgroundColor: colors.surface,
    },
    weekdaysRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: sizes.space.xs,
      paddingVertical: 4,
    },
    weekdayText: {
      width: '14.28%',
      textAlign: 'center',
      fontSize: sizes.text.xs,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    cell: {
      width: '14.28%',
      aspectRatio: 1,
      padding: 3,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyDayCircle: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 999,
    },
    dayText: {
      fontSize: sizes.text.sm,
      fontWeight: '500',
      color: colors.textPrimary,
    },
    photoBubble: {
      width: '100%',
      height: '100%',
      borderRadius: 999,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    photoBubbleSelected: {
      borderWidth: 2,
      borderColor: colors.accent1,
    },
    bubbleImage: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
    },
    bubbleOverlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.35)',
    },
    photoDayText: {
      color: '#ffffff',
      fontSize: sizes.text.sm,
      fontWeight: '800',
      textShadowColor: 'rgba(0,0,0,0.7)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    selectedSection: {
      marginTop: sizes.space.md,
      paddingTop: sizes.space.sm,
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
    },
    selectedHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: sizes.space.xs,
    },
    selectedTitle: {
      fontSize: sizes.text.body,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    photoStrip: {
      flexDirection: 'row',
      paddingVertical: sizes.space.xs,
    },
    stripThumbnailWrap: {
      marginRight: sizes.space.sm,
      borderRadius: sizes.radius.btn,
      overflow: 'hidden',
    },
    stripThumbnail: {
      width: 72,
      height: 72,
      borderRadius: sizes.radius.btn,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: '#000000dd',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    modalClose: {
      position: 'absolute',
      top: 50,
      right: 20,
      zIndex: 10,
      padding: 8,
    },
    modalContent: {
      width: '100%',
      height: '80%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalImage: {
      width: '100%',
      height: '90%',
    },
    modalCaption: {
      color: '#ffffff',
      fontSize: sizes.text.body,
      marginTop: 12,
      textAlign: 'center',
    },
  })
}
