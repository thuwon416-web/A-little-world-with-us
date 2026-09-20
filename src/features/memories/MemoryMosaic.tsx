'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, Heart, Sparkles } from 'lucide-react'

type MosaicTile = {
  id: string
  label: string
  image: string
  tint: string
}

const defaultTiles: MosaicTile[] = [
  {
    id: 't1',
    label: 'Sunset walk',
    image: '/images/hero-1.jpg',
    tint: 'from-accent-1 to-accent-1',
  },
  {
    id: 't2',
    label: 'Café date',
    image: '/images/hero-2.jpg',
    tint: 'from-accent-2 to-accent-2',
  },
  {
    id: 't3',
    label: 'Late-night laughs',
    image: '/images/hero-3.jpg',
    tint: 'from-accent-1 to-accent-1',
  },
  {
    id: 't4',
    label: 'Weekend getaway',
    image: '/images/hero-4.jpg',
    tint: 'from-accent-1 to-accent-1',
  },
  {
    id: 't5',
    label: 'Slow morning',
    image: '/images/hero-5.jpg',
    tint: 'from-accent-1 to-accent-1',
  },
  {
    id: 't6',
    label: 'Dreams together',
    image: '/images/hero-6.jpg',
    tint: 'from-accent-1 to-accent-1',
  },
]

export default function MemoryMosaic() {
  const [tiles] = useState(defaultTiles)
  const [active, setActive] = useState(defaultTiles[0]?.id ?? '')

  const activeTile = tiles.find((tile) => tile.id === active) ?? tiles[0] ?? null

  if (!activeTile) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-accent-2">
        <Camera className="h-5 w-5" />
        <h3 className="font-dancing text-2xl">Memory Mosaic</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map((tile) => (
          <motion.button
            key={tile.id}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActive(tile.id)}
            className={`group relative overflow-hidden rounded-btn border ${
              active === tile.id
                ? 'border-accent-1/20 ring-2 ring-accent-1/20'
                : 'border-accent-1/20'
            }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${tile.tint}`} />
            <div
              className="relative h-28 w-full bg-cover bg-center"
              style={{ backgroundImage: `url('${tile.image}')` }}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-soft-tint/60 to-transparent p-2 text-left text-xs text-text-1">
              {tile.label}
            </div>
          </motion.button>
        ))}
      </div>

      <div className="rounded-btn border border-accent-1/30 bg-gradient-to-r from-accent-1 to-accent-1 p-3 text-sm text-text-1/80">
        <div className="mb-1 flex items-center gap-2 font-medium text-accent-2">
          <Heart className="h-4 w-4" />
          Featured moment
        </div>
        <p className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent-1" />
          {activeTile.label}
        </p>
      </div>
    </div>
  )
}
