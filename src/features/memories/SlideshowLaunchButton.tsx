'use client'

import { Play } from 'lucide-react'
type SlideshowMemory = { id: string; image_url: string | null }

export default function SlideshowLaunchButton({ memories, onClick }: { memories: SlideshowMemory[]; onClick: () => void }) {
  const photoCount = memories.filter((memory) => memory.image_url).length
  if (photoCount < 2) return null
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-2 rounded-2xl bg-[var(--button-bg)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:opacity-90">
      <Play className="h-4 w-4" /> Play Slideshow
    </button>
  )
}
