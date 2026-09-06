'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { getCurrentUserId } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

export default function MemoryLane() {
  const [memories, setMemories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const loadUserId = async () => {
      const id = await getCurrentUserId()
      setUserId(id)
    }
    loadUserId()
  }, [])

  useEffect(() => {
    if (userId) {
      loadMemories()
    }
  }, [userId])

  const loadMemories = async () => {
    if (!userId) return

    const today = new Date()
    const currentMonth = today.getMonth()
    const currentDay = today.getDate()

    const { data } = await supabase
      .from('memories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Filter memories from same month/day in previous years
    const onThisDay = data?.filter(memory => {
      const memoryDate = new Date(memory.created_at)
      return memoryDate.getMonth() === currentMonth && 
             memoryDate.getDate() === currentDay &&
             memoryDate.getFullYear() !== today.getFullYear()
    }) || []

    setMemories(onThisDay)
    setLoading(false)
  }

  if (loading) return <div className="text-[var(--text-secondary)]">Loading memories...</div>

  return (
    <div className="p-6 space-y-6">
      <section className="rounded-[32px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6 shadow-[0_18px_42px_rgba(0,0,0,0.12)]">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Memories</p>
        <h1 className="mt-3 text-3xl font-serif text-[var(--text-primary)]">📸 On This Day</h1>
      </section>
      
      {memories.length === 0 ? (
        <div className="rounded-[24px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-5">
          <p className="text-[var(--text-secondary)]">No memories from this day in previous years</p>
        </div>
      ) : (
        <div className="space-y-4">
          {memories.map(memory => (
            <div key={memory.id} className="rounded-[24px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-5">
              <div className="text-sm text-[var(--text-secondary)] mb-2">
                {new Date(memory.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
              {memory.photo_url && (
                <Image
                  src={memory.photo_url}
                  alt={memory.title}
                  width={400}
                  height={192}
                  className="w-full h-48 object-cover rounded-xl mb-2"
                />
              )}
              <h3 className="font-bold text-[var(--text-primary)]">{memory.title}</h3>
              <p className="text-[var(--text-secondary)]">{memory.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
