'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { useState } from 'react'

type LocationPoint = {
  id: string
  name: string
  x: number
  y: number
  story: string
  photo: string
  accent: string
}

const locations: LocationPoint[] = [
  {
    id: 'cafe',
    name: 'The Cozy Cafe',
    x: 24,
    y: 35,
    story: 'Our first date with coffee, laughter, and a little bit of nervous energy.',
    photo:
      'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=900&q=80',
    accent: 'bg-[var(--bg-2)]',
  },
  {
    id: 'beach',
    name: 'Sunset Beach',
    x: 68,
    y: 58,
    story: 'The place where the sky turned pink and somehow our hearts did too.',
    photo:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
    accent: 'bg-[var(--bg-2)]',
  },
  {
    id: 'city',
    name: 'Night Walks',
    x: 52,
    y: 27,
    story: 'A city full of lights, all of them beautiful because we were in them together.',
    photo:
      'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=900&q=80',
    accent: 'bg-[var(--bg-2)]',
  },
]

export default function RelationshipMap() {
  const [selected, setSelected] = useState<LocationPoint | null>(locations[0] ?? null)

  if (!selected) {
    return null
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="relative h-72 overflow-hidden rounded-3xl border border-[var(--accent-1)]/20 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.35),rgba(255,255,255,0.06)_35%,transparent_60%)]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,182,193,0.18),rgba(122,173,255,0.08),rgba(255,215,0,0.09))]" />
        <div className="absolute inset-4 rounded-[2rem] border border-[var(--accent-1)]/20" />
        <div className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[var(--accent-1)]/20" />
        <div className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[var(--accent-1)]/20" />

        {locations.map((location) => (
          <button
            key={location.id}
            type="button"
            onClick={() => setSelected(location)}
            className="absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
            style={{ left: `${location.x}%`, top: `${location.y}%` }}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.96 }}
              className={`relative flex items-center justify-center rounded-full ${location.accent} h-5 w-5 shadow-[0_0_18px_rgba(255,182,193,0.8)]`}
            >
              <MapPin className="h-4 w-4 text-[var(--text-primary)]" />
            </motion.div>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={selected.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="space-y-3 rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3"
        >
          <img
            src={selected.photo}
            alt={selected.name}
            className="h-40 w-full rounded-2xl object-cover"
          />
          <div className="flex items-center gap-2 text-[var(--accent-2)]">
            <MapPin className="h-4 w-4" />
            <h4 className="font-dancing text-2xl">{selected.name}</h4>
          </div>
          <p className="text-sm leading-relaxed opacity-75">{selected.story}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
