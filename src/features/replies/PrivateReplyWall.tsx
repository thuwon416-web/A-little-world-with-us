'use client'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

export default function PrivateReplyWall() {
  const [reply, setReply] = useState('')
  return (
    <Card className="w-full max-w-md">
      <CardContent className="space-y-4">
        <h2 className="text-2xl font-serif">Private Reply Wall</h2>
        <Textarea
          placeholder="Write something only they can see..."
          value={reply}
          onChange={(e) => setReply(e.target.value)}
        />
        <Button className="w-full bg-rose-600">Pin to Wall</Button>
      </CardContent>
    </Card>
  )
}
