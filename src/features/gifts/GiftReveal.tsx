'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Confetti from '@/features/dashboard/Confetti'

export default function GiftReveal() {
  const [revealed, setRevealed] = useState(false)
  return (
    <Card className="p-8 text-center">
      {revealed ? (
        <div>
          <Confetti trigger={revealed} />
          <h2 className="text-4xl font-serif mb-4">🎁 You found a surprise!</h2>
          <p className="text-lg">A special message from your love...</p>
        </div>
      ) : (
        <div>
          <h3 className="text-xl mb-4">A gift awaits you...</h3>
          <Button onClick={() => setRevealed(true)} className="bg-rose-500">
            Unwrap Gift
          </Button>
        </div>
      )}
    </Card>
  )
}
