'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface MemoryCardProps { id?: string | number; imageUrl: string; caption: string; date: string; index: number; priority?: boolean; onOpen?: () => void }

const MemoryCardComponent = function MemoryCard({ imageUrl, caption, date, index, priority = false, onOpen }: MemoryCardProps) {
  const rotation = index % 2 === 0 ? '-rotate-1' : 'rotate-1'
  return <motion.button type="button" onClick={onOpen} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.28, delay: index * 0.03 }} className="glass-card group w-full overflow-hidden rounded-2xl p-2 text-left transition hover:glow-rose">
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br from-accent-1/20 via-card to-accent-2/15">
      <img src={imageUrl} alt={caption || 'Memory'} loading={priority ? 'eager' : 'lazy'} decoding="async" className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
    </div>
    <div className="min-w-0 px-1 pb-1 pt-3"><h3 className="truncate font-serif text-base text-text-1">{caption || 'A moment together'}</h3><p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-text-2">{new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
  </motion.button>
}

export default React.memo(MemoryCardComponent)
