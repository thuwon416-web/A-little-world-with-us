'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, ListTodo, Sparkles } from 'lucide-react'
import { AnimatedIcon } from '@/components/ui/animated-icon'
import { supabase } from '@/lib/supabase'

type BucketItem = {
  id: string
  label: string
  done: boolean
  progress: number
  target: string
}

type BucketItemProps = {
  item: BucketItem
  onToggle: (id: string) => void
}

const BucketItemComponent = function BucketItem({ item, onToggle }: BucketItemProps) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      onClick={() => onToggle(item.id)}
      className={`w-full rounded-btn border p-3 text-left ${item.done ? 'border-accent-1/20 bg-accent-2/20' : 'border-accent-1/20 bg-card/25'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="font-medium text-text-1">{item.label}</div>
        <span className="flex items-center gap-2 text-[9px] uppercase tracking-[0.18em]">
          <CheckCircle2 className={`h-4 w-4 ${item.done ? 'fill-current' : ''}`} />
          {item.done ? 'done' : 'next'}
        </span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-card/40 overflow-hidden">
        <motion.div
          animate={{ width: `${item.progress}%` }}
          className="h-full rounded-full bg-gradient-to-r from-accent-1 to-accent-2"
        />
      </div>
      <div className="mt-2 text-[11px] opacity-60">{item.target}</div>
    </motion.button>
  )
}

const MemoizedBucketItem = React.memo(BucketItemComponent)

export default function BucketList() {
  const [items, setItems] = useState<BucketItem[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBucketList = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: coupleData } = await supabase
        .from('couple_links')
        .select('couple_id')
        .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
        .eq('status', 'accepted')
        .maybeSingle()

      if (!coupleData?.couple_id) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('bucket_list')
        .select('*')
        .eq('couple_id', coupleData.couple_id)
        .order('created_at', { ascending: false })

      if (data) {
        setItems(
          data.map((item) => ({
            id: item.id,
            label: item.title || item.item || '',
            done: item.completed,
            progress: item.completed ? 100 : 15,
            target: 'New plan',
          }))
        )
      }
      setLoading(false)
    }

    fetchBucketList()

    // Real-time subscription
    const channel = supabase
      .channel('bucket-list-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bucket_list' }, () => fetchBucketList())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const totalProgress = useMemo(() => {
    const doneCount = items.filter((item) => item.done).length
    return items.length ? Math.round((doneCount / items.length) * 100) : 0
  }, [items])

  const addItem = async () => {
    const value = draft.trim()
    if (!value) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: coupleData } = await supabase
      .from('couple_links')
      .select('couple_id')
      .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
      .eq('status', 'accepted')
      .maybeSingle()

    if (!coupleData?.couple_id) return

    const { error } = await supabase
      .from('bucket_list')
      .insert({
        couple_id: coupleData.couple_id,
        user_id: user.id,
        title: value,
        item: value,
        completed: false,
      })

    if (error) {
      console.error('Failed to add item:', error)
    } else {
      setDraft('')
    }
  }

  const toggleItem = async (id: string) => {
    const item = items.find((i) => i.id === id)
    if (!item) return

    const { error } = await supabase
      .from('bucket_list')
      .update({ 
        completed: !item.done,
        completed_at: !item.done ? new Date().toISOString() : null
      })
      .eq('id', id)

    if (error) {
      console.error('Failed to toggle item:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-accent-2">
          <ListTodo className="w-5 h-5" />
          <h3 className="font-dancing text-2xl">Lists</h3>
        </div>
        <div className="rounded-full bg-card px-2 py-1 text-[10px] uppercase tracking-[0.2em]">
          {totalProgress}% done
        </div>
      </div>

      {loading ? (
        <div className="text-center text-text-2">Loading...</div>
      ) : (
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="text-center text-text-2">No items yet. Add your first shared dream!</div>
          ) : (
            items.map((item) => (
              <MemoizedBucketItem
                key={item.id}
                item={item}
                onToggle={toggleItem}
              />
            ))
          )}
        </div>
      )}

      <div className="space-y-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a shared dream"
          className="w-full rounded-btn border border-accent-1/20 bg-card p-3 text-sm outline-none"
        />
        <button
          onClick={addItem}
          className="glass-button flex w-full items-center justify-center gap-2 text-sm"
        >
          <AnimatedIcon name="Plus" animation="pulse" trigger="hover" size={16} /> Add to list
        </button>
      </div>
      <div className="rounded-btn border border-accent-1/20 bg-gradient-to-r from-accent-2 to-accent-1 p-3 text-sm">
        <div className="mb-1 flex items-center gap-2 font-medium">
          <Sparkles className="h-4 w-4" />
          Shared promise
        </div>
        <p>Life is richer when you make room for adventures, even the small ones.</p>
      </div>
    </div>
  )
}
