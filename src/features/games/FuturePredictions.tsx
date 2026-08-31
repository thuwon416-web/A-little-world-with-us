'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

const predictions = [
  'Next month brings a quiet, beautiful milestone—one small ritual that makes you feel unexpectedly chosen.',
  'A spontaneous plan will become one of your favorite memories, simply because you were together.',
  'Your relationship will deepen through a conversation that feels honest, warm, and incredibly safe.',
  'A dream you almost forgot will come back into focus, and you’ll both feel more aligned than ever.',
]

export default function FuturePredictions() {
  const [index, setIndex] = useState(0)

  const prediction = useMemo(() => predictions[index], [index])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[var(--accent-2)]">
        <Star className="w-5 h-5" />
        <h3 className="font-dancing text-2xl">Future Predictions</h3>
      </div>

      <motion.div layout className="glass-card rounded-2xl p-3">
        <div className="text-xs uppercase tracking-[0.2em] text-[var(--accent-1)] mb-2">
          Next reading
        </div>
        <p className="text-sm leading-relaxed text-[var(--text-primary)]/80">{prediction}</p>
      </motion.div>

      <button
        onClick={() => setIndex((prev) => (prev + 1) % predictions.length)}
        className="glass-button w-full text-sm"
      >
        Reveal another prediction
      </button>
    </div>
  )
}
