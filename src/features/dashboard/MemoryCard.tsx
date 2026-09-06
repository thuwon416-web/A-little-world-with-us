'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

interface MemoryCardProps { id?: string | number; imageUrl: string; caption: string; date: string; index: number; priority?: boolean; onOpen?: () => void }

export default function MemoryCard({ imageUrl, caption, date, index, priority = false, onOpen }: MemoryCardProps) {
  const rotation = index % 2 === 0 ? '-rotate-1' : 'rotate-1'
  return <motion.button type="button" onClick={onOpen} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.28, delay: index * 0.03 }} className={`glass-card group w-full overflow-hidden p-3 text-left ${rotation} hover:rotate-0 hover:glow-rose`}>
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br from-[var(--accent-1)]/30 via-[var(--bg-2)] to-[var(--accent-2)]/25">
      <Image src={imageUrl} alt={caption || 'Memory'} fill priority={priority} loading={priority ? 'eager' : 'lazy'} className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 50vw" />
    </div>
    <div className="px-2 pb-1 pt-4"><h3 className="font-serif text-xl text-[var(--text-primary)]">{caption || 'A moment together'}</h3><p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)]">{new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
  </motion.button>
}
