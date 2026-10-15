'use client'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const notes = [
  'You are my sunshine.',
  'I love you more than coffee.',
  'Every moment with you is a gift.',
]

function secureRandomIndex(length: number) {
  const range = 2 ** 32
  const limit = Math.floor(range / length) * length
  const values = new Uint32Array(1)
  do {
    crypto.getRandomValues(values)
  } while (values[0] >= limit)
  return values[0] % length
}

export default function LoveNoteGenerator() {
  const [note, setNote] = useState('')

  const handleGenerate = () => {
    const randomIndex = secureRandomIndex(notes.length)
    const chosenNote = notes[randomIndex] ?? notes[0] ?? ''
    setNote(chosenNote)
  }

  return (
    <Card className="text-center">
      <CardContent className="space-y-4 p-6">
        <h2 className="text-2xl font-serif">Love Note Generator</h2>
        {note && <p className="text-xl italic text-rose-600">&quot;{note}&quot;</p>}
        <Button onClick={handleGenerate}>
          Generate a Note
        </Button>
      </CardContent>
    </Card>
  )
}
