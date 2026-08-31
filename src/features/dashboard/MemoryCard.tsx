'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useRef, useState } from 'react'

interface MemoryCardProps {
  id?: string | number
  imageUrl: string
  caption: string
  date: string
  index: number // Determines slide direction
  hiddenMessage?: string
  priority?: boolean
}

/**
 * Enhanced memory card with 3D tilt, reflective shine, and cinematic entrance.
 */
export default function MemoryCard({
  id,
  imageUrl,
  caption,
  date,
  index,
  hiddenMessage,
  priority = false,
}: MemoryCardProps) {
  const isEven = index % 2 === 0
  const [flipped, setFlipped] = useState(false)
  const cardRef = useRef<HTMLDivElement | null>(null)

  const handleClueClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      window.dispatchEvent(new CustomEvent('scavenger:found', { detail: { id } }))
    } catch (err) {
      // ignore
    }
  }

  return (
    <motion.div
      ref={cardRef}
      onClick={() => setFlipped((v) => !v)}
      initial={{ opacity: 0, x: isEven ? -60 : 60, scale: 0.98 }}
      whileInView={{ opacity: 1, x: 0, scale: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: 'easeOut', delay: 0.06 }}
      className="relative w-full h-72 perspective-1000 mb-10"
    >
      <motion.div
        className="relative w-full h-full"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 26 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden rounded-md overflow-hidden glass-card">
          <div className="relative h-full w-full">
            <Image
              src={imageUrl}
              alt={caption || 'Memory'}
              fill
              priority={priority}
              loading={priority ? 'eager' : 'lazy'}
              className="object-cover"
              sizes="(max-width:768px) 100vw, 700px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-2)]/45 to-transparent" />

            {/* small hidden clue button */}
            <button
              onClick={handleClueClick}
              className="absolute bottom-3 right-3 bg-[var(--accent-1)]/80 text-[var(--text-primary)] w-8 h-8 rounded-full flex items-center justify-center shadow-md"
              aria-label="clue"
              data-clue-id={id}
              title="Find me"
            >
              ❤
            </button>
          </div>

          <div className="p-5">
            <p className="font-dancing text-2xl text-[var(--accent-2)] mb-1">{caption}</p>
            <p className="text-xs opacity-60 uppercase tracking-widest">
              {new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Back */}
        <div className="absolute inset-0 rounded-md overflow-hidden glass-card transform rotateY-180 backface-hidden p-6 flex flex-col items-center justify-center">
          <h3 className="font-dancing text-2xl text-[var(--accent-2)] mb-3">A Secret</h3>
          <p className="text-sm opacity-80 text-center">
            {hiddenMessage || 'You found a hidden note! Click again to flip back.'}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
