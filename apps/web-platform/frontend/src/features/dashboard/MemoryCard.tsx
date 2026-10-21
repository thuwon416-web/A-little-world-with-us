'use client'
/* eslint-disable @next/next/no-img-element -- Authenticated same-origin Drive image endpoint must bypass Next image optimization. */

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Heart, Image as ImageIcon, MapPin, Trash2 } from 'lucide-react'

export interface MemoryCardProps {
  id?: string | number
  imageUrl?: string | null
  caption: string
  date: string
  index: number
  priority?: boolean
  category?: string | null
  locationLabel?: string | null
  onOpen?: () => void
  onDelete?: () => void
}

const MemoryCardComponent = function MemoryCard({
  imageUrl,
  caption,
  date,
  index,
  priority = false,
  category,
  locationLabel,
  onOpen,
  onDelete,
}: MemoryCardProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  const hasValidImage = Boolean(imageUrl) && !error

  const formattedDate = (() => {
    try {
      return new Date(date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return date
    }
  })()

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.03, 0.3) }}
      className="glass-card group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-2 text-left shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-accent-1/40 hover:shadow-[0_16px_32px_rgba(0,0,0,0.12)]"
    >
      {/* Media Container */}
      <button
        type="button"
        onClick={onOpen}
        className="relative aspect-square sm:aspect-[4/5] w-full overflow-hidden rounded-xl bg-gradient-to-br from-accent-1/10 via-soft-tint to-accent-2/15 text-left focus:outline-none focus:ring-2 focus:ring-accent-1"
        aria-label={`View memory: ${caption || 'Untitled memory'}`}
      >
        {hasValidImage ? (
          <>
            {!loaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-card via-soft-tint to-accent-1/10 animate-pulse flex flex-col items-center justify-center p-3 text-center">
                <Heart className="h-8 w-8 text-accent-1/40 mb-1" />
                <span className="text-[11px] text-text-2/70 font-serif">Keeping memory safe...</span>
              </div>
            )}
            <img
              src={imageUrl!}
              alt={caption || 'Memory'}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              onLoad={() => setLoaded(true)}
              onError={() => setError(true)}
              className={`absolute inset-0 h-full w-full object-cover object-center transition-all duration-500 group-hover:scale-[1.04] ${
                loaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-accent-1/15 via-soft-tint to-accent-2/15">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-1/20 text-accent-1 mb-2.5 shadow-xs">
              <Heart className="h-6 w-6 fill-current text-accent-1" />
            </div>
            <p className="line-clamp-2 font-serif text-sm font-semibold text-text-1">
              {caption || 'A moment together'}
            </p>
            <p className="mt-1 text-[11px] text-text-2">Shared keepsake</p>
          </div>
        )}

        {/* Category Pill */}
        {category && (
          <div className="absolute left-2.5 top-2.5 z-10 pointer-events-none">
            <span className="inline-flex items-center rounded-full backdrop-blur-md bg-black/45 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white shadow-sm">
              {category}
            </span>
          </div>
        )}
      </button>

      {/* Floating Action: Delete Button */}
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute right-3.5 top-3.5 z-20 flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-md bg-black/40 text-white/90 shadow-sm transition hover:bg-error hover:text-white group-hover:opacity-100 sm:opacity-0 focus:opacity-100"
          title="Delete memory"
          aria-label="Delete memory"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Card Details */}
      <div className="flex flex-col gap-1 px-1.5 pb-1 pt-2.5 min-w-0">
        <h3
          onClick={onOpen}
          className="cursor-pointer truncate font-serif text-sm font-semibold text-text-1 hover:text-accent-1 transition"
          title={caption || 'A moment together'}
        >
          {caption || 'A moment together'}
        </h3>
        <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-text-2">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3 opacity-70" />
            {formattedDate}
          </span>
          {locationLabel && (
            <span className="flex items-center gap-0.5 truncate max-w-[120px]" title={locationLabel}>
              <MapPin className="h-3 w-3 text-accent-1 shrink-0" />
              <span className="truncate">{locationLabel}</span>
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default React.memo(MemoryCardComponent)
