'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, Flag, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Plan = {
  id: string
  title: string
  type: string
  dueDate: string
  status: 'In progress' | 'Completed'
  items: { id: string; label: string; done: boolean }[]
}

const bucketList = [
  'Watch the sunrise together in a new city',
  'Take a road trip with no itinerary',
  'Create a mini home gallery wall',
]

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPlans = async () => {
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

      const { data: plansData } = await supabase
        .from('plans')
        .select('*')
        .eq('couple_id', coupleData.couple_id)
        .order('created_at', { ascending: false })

      if (plansData) {
        const planIds = plansData.map((p) => p.id)
        const { data: itemsData } = await supabase
          .from('plan_items')
          .select('*')
          .in('plan_id', planIds)

        const plansWithItems = plansData.map((plan) => ({
          id: plan.id,
          title: plan.title,
          type: plan.type,
          dueDate: plan.due_date ? new Date(plan.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
          status: (plan.status === 'completed' ? 'Completed' : 'In progress') as 'In progress' | 'Completed',
          items: (itemsData || [])
            .filter((item) => item.plan_id === plan.id)
            .map((item) => ({
              id: item.id,
              label: item.title,
              done: item.completed,
            })),
        })) as Plan[]
        setPlans(plansWithItems)
      }
      setLoading(false)
    }

    fetchPlans()

    // Real-time subscription
    const channel = supabase
      .channel('plans-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plans' }, () => fetchPlans())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plan_items' }, () => fetchPlans())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const progress = useMemo(() => {
    const totalTasks = plans.reduce((sum, plan) => sum + plan.items.length, 0)
    const completedTasks = plans.reduce(
      (sum, plan) => sum + plan.items.filter((item) => item.done).length,
      0,
    )
    return totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)
  }, [plans])

  const toggleItem = async (planId: string, itemId: string) => {
    const plan = plans.find((p) => p.id === planId)
    const item = plan?.items.find((i) => i.id === itemId)
    if (!item) return

    const { error } = await supabase
      .from('plan_items')
      .update({ completed: !item.done })
      .eq('id', itemId)

    if (error) {
      console.error('Failed to toggle item:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-text-2">Shared plans</p>
          <h1 className="mt-2 text-3xl font-serif text-text-1">Our next chapters</h1>
        </div>
        <button type="button" className="rounded-full bg-accent-1 px-4 py-2 text-sm font-medium text-white">
          New plan
        </button>
      </div>

      {loading ? (
        <div className="text-center text-text-2">Loading plans...</div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            {plans.length === 0 ? (
              <div className="text-center text-text-2">No plans yet. Create your first shared plan!</div>
            ) : (
              plans.map((plan) => {
            const doneCount = plan.items.filter((item) => item.done).length
            const planProgress = plan.items.length ? Math.round((doneCount / plan.items.length) * 100) : 0

            return (
              <div key={plan.id} className="rounded-modal border border-accent-1/20 bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-text-2">{plan.type}</p>
                    <h2 className="mt-2 text-2xl font-semibold text-text-1">{plan.title}</h2>
                  </div>
                  <div className="rounded-full bg-card px-3 py-1 text-xs text-text-2">
                    {plan.status}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm text-text-2">
                  <CalendarDays className="h-4 w-4 text-accent-2" />
                  Due {plan.dueDate}
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-text-2">
                    <span>Progress</span>
                    <span>{planProgress}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-soft-tint">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--accent-1)] to-[var(--accent-2)]"
                      style={{ width: `${planProgress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  {plan.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleItem(plan.id, item.id)}
                      className="flex w-full items-center gap-3 rounded-btn border border-border bg-card px-3 py-2 text-left text-text-1"
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                          item.done
                            ? 'border-success bg-success/20 text-success'
                            : 'border-text-2 text-transparent'
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </span>
                      <span className={item.done ? 'line-through text-text-2' : ''}>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
            })
          )}
          </div>

          <div className="space-y-4">
            <div className="rounded-[24px] border border-accent-1/20 bg-card p-5">
              <div className="flex items-center gap-3 text-accent-1">
                <Flag className="h-5 w-5" />
                <span className="text-sm font-medium">Overall progress</span>
              </div>
              <p className="mt-4 text-4xl font-semibold text-text-1">{progress}%</p>
              <p className="mt-2 text-sm text-text-2">Shared dreams are moving forward.</p>
            </div>

            <div className="rounded-[24px] border border-border bg-card p-5">
              <div className="flex items-center gap-3 text-accent-2">
                <Sparkles className="h-5 w-5" />
                <span className="text-sm font-medium">Bucket list</span>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-text-1">
                {bucketList.map((item) => (
                  <li key={item} className="rounded-btn bg-card px-3 py-2">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
