'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Camera, Calendar as CalendarIcon, ExternalLink, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export interface CalendarPhotoItem {
  id: string
  url: string
  date: string // YYYY-MM-DD
  caption?: string | null
  source: 'memory' | 'chat' | 'gallery'
}

interface PhotoMediaCalendarProps {
  coupleId?: string | null
  className?: string
  onSelectDate?: (date: string, photos: CalendarPhotoItem[]) => void
}

function formatDateKey(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
}

export default function PhotoMediaCalendar({
  coupleId,
  className = '',
  onSelectDate,
}: PhotoMediaCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [photos, setPhotos] = useState<CalendarPhotoItem[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [activePhotoPreview, setActivePhotoPreview] = useState<CalendarPhotoItem | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const loadPhotosForMonth = useCallback(async () => {
    if (!coupleId) return

    try {
      const startOfMonth = new Date(year, month, 1)
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59)
      const startIso = startOfMonth.toISOString().slice(0, 10)
      const endIso = endOfMonth.toISOString().slice(0, 10)

      const collected: CalendarPhotoItem[] = []

      // 1. Fetch from memories
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
              caption: m.caption || m.title || undefined,
              source: 'memory',
            })
          }
        }
      }

      // 2. Fetch from photo messages
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
              caption: c.content || undefined,
              source: 'chat',
            })
          }
        }
      }

      setPhotos(collected)
    } catch (err) {
      console.warn('Failed to fetch calendar photo media:', err)
    }
  }, [coupleId, year, month])

  useEffect(() => {
    void loadPhotosForMonth()
  }, [loadPhotosForMonth])

  // Map photos by date key YYYY-MM-DD
  const photosByDate = useMemo(() => {
    const map = new Map<string, CalendarPhotoItem[]>()
    for (const item of photos) {
      const existing = map.get(item.date) || []
      existing.push(item)
      map.set(item.date, existing)
    }
    return map
  }, [photos])

  // Calendar calculations
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay() // 0 = Sunday

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDate(null)
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDate(null)
  }

  const monthLabel = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const selectedPhotos = selectedDate ? photosByDate.get(selectedDate) || [] : []

  const handleDayClick = (dayStr: string, dayPhotos: CalendarPhotoItem[]) => {
    setSelectedDate(dayStr)
    if (dayPhotos.length > 0) {
      setActivePhotoPreview(dayPhotos[0])
    } else {
      setActivePhotoPreview(null)
    }
    onSelectDate?.(dayStr, dayPhotos)
  }

  return (
    <div className={`rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-card ${className}`}>
      {/* Calendar Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-1/15 text-accent-1">
            <CalendarIcon className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-serif font-semibold text-text-1">{monthLabel}</h2>
            <p className="text-[11px] text-text-2">
              {photos.length > 0 ? `${photos.length} shared photos this month` : 'Relive your memories by day'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-text-2 hover:bg-accent-1/10 hover:text-text-1 transition"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-text-2 hover:bg-accent-1/10 hover:text-text-1 transition"
            aria-label="Next month"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Weekday Labels (S, M, T, W, T, F, S) */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-2 text-center text-[11px] font-semibold uppercase tracking-wider text-text-2/70">
        <span>S</span>
        <span>M</span>
        <span>T</span>
        <span>W</span>
        <span>T</span>
        <span>F</span>
        <span>S</span>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {/* Empty slots before first day */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Days of month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dateStr = formatDateKey(year, month, day)
          const dayPhotos = photosByDate.get(dateStr) || []
          const hasPhoto = dayPhotos.length > 0
          const isSelected = selectedDate === dateStr
          const thumbnailPhoto = dayPhotos[0]

          const todayIso = new Date().toISOString().slice(0, 10)
          const isToday = dateStr === todayIso

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => handleDayClick(dateStr, dayPhotos)}
              className={`group relative flex aspect-square items-center justify-center rounded-full transition-transform duration-150 active:scale-95 ${
                isSelected
                  ? 'ring-2 ring-accent-1 ring-offset-2 ring-offset-card scale-105'
                  : 'hover:scale-105'
              }`}
              title={`${dateStr}${hasPhoto ? ` (${dayPhotos.length} photos)` : ''}`}
            >
              {hasPhoto ? (
                /* Telegram-style Circular Photo Thumbnail */
                <div className="relative h-full w-full overflow-hidden rounded-full shadow-sm">
                  <Image
                    src={thumbnailPhoto.url}
                    alt={`Memory from ${dateStr}`}
                    fill
                    sizes="(max-width: 768px) 44px, 64px"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    unoptimized
                  />
                  {/* Subtle dark tint so the white date number is crisp and legible */}
                  <div className="absolute inset-0 bg-black/35 group-hover:bg-black/25 transition-colors" />

                  {/* Day Number */}
                  <span className="relative z-10 text-xs sm:text-sm font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                    {day}
                  </span>

                  {/* Multiple photos badge dot */}
                  {dayPhotos.length > 1 && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 z-10 h-1.5 w-1.5 rounded-full bg-accent-1 ring-1 ring-white" />
                  )}
                </div>
              ) : (
                /* Clean date circle */
                <div
                  className={`flex h-full w-full items-center justify-center rounded-full text-xs sm:text-sm transition-all ${
                    isSelected
                      ? 'bg-accent-1 text-white font-bold shadow-md'
                      : isToday
                      ? 'border-2 border-accent-1 bg-accent-1/15 font-bold text-accent-1'
                      : 'text-text-1 font-medium hover:bg-accent-1/10 hover:text-text-1'
                  }`}
                >
                  {day}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Selected Day Photos Preview Banner */}
      {selectedDate && (
        <div className="mt-6 border-t border-accent-1/15 pt-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-accent-1" />
              <h3 className="text-sm font-semibold text-text-1">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </h3>
              <span className="rounded-full bg-accent-1/15 px-2 py-0.5 text-[11px] font-medium text-accent-1">
                {selectedPhotos.length} {selectedPhotos.length === 1 ? 'photo' : 'photos'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="p-1 rounded-full text-text-2 hover:bg-accent-1/10 hover:text-text-1 transition"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {selectedPhotos.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {selectedPhotos.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => setActivePhotoPreview(photo)}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-accent-1/15 bg-card/60 cursor-pointer shadow-sm"
                >
                  <Image
                    src={photo.url}
                    alt={photo.caption || 'Shared memory'}
                    fill
                    sizes="(max-width: 768px) 96px, 128px"
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                    unoptimized
                  />
                  {photo.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                      <p className="truncate text-[10px] text-white">{photo.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center rounded-xl border border-dashed border-accent-1/20 bg-card/40">
              <p className="text-xs text-text-2 mb-2">No photos captured on this date.</p>
              <Link
                href="/memories"
                className="inline-flex items-center gap-1.5 text-xs text-accent-1 hover:underline font-medium"
              >
                <span>Add a memory for this date</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal for Active Photo Preview */}
      {activePhotoPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setActivePhotoPreview(null)}
        >
          <div
            className="relative max-w-2xl w-full max-h-[85vh] flex flex-col items-center overflow-hidden rounded-2xl bg-card border border-accent-1/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full px-4 py-3 border-b border-accent-1/15 bg-card/90">
              <span className="text-xs font-semibold text-text-1">
                {new Date(activePhotoPreview.date + 'T00:00:00').toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <button
                type="button"
                onClick={() => setActivePhotoPreview(null)}
                className="p-1 rounded-full text-text-2 hover:bg-accent-1/10 hover:text-text-1 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative w-full h-[60vh] bg-black/40 flex items-center justify-center">
              <Image
                src={activePhotoPreview.url}
                alt={activePhotoPreview.caption || 'Photo preview'}
                fill
                className="object-contain"
                unoptimized
              />
            </div>

            {activePhotoPreview.caption && (
              <div className="w-full p-4 border-t border-accent-1/15 bg-card text-center">
                <p className="text-sm text-text-1">{activePhotoPreview.caption}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
