'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, Flag, Plus, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { EmptyState } from '@/components/ui/empty-state'

type Plan = {
  id: string
  title: string
  type: string
  dueDate: string
  status: 'In progress' | 'Completed'
  items: { id: string; label: string; done: boolean }[]
  updated_at: string
}

type PlanRecord = {
  id: string
  title: string
  type: string
  due_date: string | null
  status: string
  updated_at: string
  created_at: string
}

const bucketList = [
  'Watch the sunrise together in a new city',
  'Take a road trip with no itinerary',
  'Create a mini home gallery wall',
]

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [conflictPlan, setConflictPlan] = useState<Plan | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState('goal')
  const [newDueDate, setNewDueDate] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    let active = true
    const fetchPlans = async (showLoading = false) => {
      if (showLoading && active) setLoading(true)
      if (active) setLoadError('')
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError
        if (!user) {
          if (active) {
            setCoupleId(null)
            setPlans([])
          }
          return
        }

        const { data: coupleData, error: coupleError } = await supabase
          .from('couple_links')
          .select('couple_id')
          .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
          .eq('status', 'accepted')
          .maybeSingle()
        if (coupleError) throw coupleError
        if (!coupleData?.couple_id) {
          if (active) {
            setCoupleId(null)
            setPlans([])
          }
          return
        }
        if (active) setCoupleId(coupleData.couple_id)

        const { data: plansData, error: plansError } = await supabase
          .from('plans')
          .select('*')
          .eq('couple_id', coupleData.couple_id)
          .order('created_at', { ascending: false })
        if (plansError) throw plansError

        const planIds = (plansData ?? []).map((plan) => plan.id)
        let itemsData: Array<{ id: string; plan_id: string; title: string; completed: boolean }> = []
        if (planIds.length) {
          const { data, error: itemsError } = await supabase
            .from('plan_items')
            .select('id,plan_id,title,completed')
            .in('plan_id', planIds)
          if (itemsError) throw itemsError
          itemsData = data ?? []
        }

        const plansWithItems = (plansData ?? []).map((plan: PlanRecord) => ({
          id: plan.id,
          title: plan.title,
          type: plan.type,
          dueDate: plan.due_date ? new Date(`${plan.due_date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '',
          status: (plan.status === 'completed' ? 'Completed' : 'In progress') as 'In progress' | 'Completed',
          updated_at: plan.updated_at || plan.created_at,
          items: itemsData
            .filter((item) => item.plan_id === plan.id)
            .map((item) => ({ id: item.id, label: item.title, done: item.completed })),
        })) as Plan[]
        if (active) setPlans(plansWithItems)
      } catch (caught) {
        if (active) setLoadError(caught instanceof Error ? caught.message : 'Unable to load shared plans.')
      } finally {
        if (showLoading && active) setLoading(false)
      }
    }

    void fetchPlans(true)

    // Real-time subscription
    const channel = supabase
      .channel('plans-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plans' }, () => void fetchPlans())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plan_items' }, () => void fetchPlans())
      .subscribe()

    return () => {
      active = false
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
    if (!item || !plan) return

    // Check for conflict by fetching latest plan version
    const { data: latestPlan } = await supabase
      .from('plans')
      .select('updated_at')
      .eq('id', planId)
      .single()

    if (latestPlan && new Date(latestPlan.updated_at) > new Date(plan.updated_at)) {
      // Conflict detected
      setConflictPlan(plan)
      return
    }

    const { error } = await supabase
      .from('plan_items')
      .update({ completed: !item.done })
      .eq('id', itemId)

    if (error) {
      console.error('Failed to toggle item:', error)
    }
  }

  const createPlan = async () => {
    if (!coupleId || !newTitle.trim()) return
    setCreating(true)
    setCreateError('')
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw userError ?? new Error('Please sign in to create a plan.')
      const { data, error } = await supabase
        .from('plans')
        .insert({
          couple_id: coupleId,
          user_id: user.id,
          title: newTitle.trim(),
          type: newType,
          due_date: newDueDate || null,
        })
        .select('id,title,type,due_date,status,updated_at,created_at')
        .single()
      if (error) throw error
      setPlans((current) => [{
        id: data.id,
        title: data.title,
        type: data.type,
        dueDate: data.due_date ? new Date(`${data.due_date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '',
        status: data.status === 'completed' ? 'Completed' : 'In progress',
        updated_at: data.updated_at || data.created_at,
        items: [],
      }, ...current])
      setNewTitle('')
      setNewType('goal')
      setNewDueDate('')
      setCreateOpen(false)
    } catch (caught) {
      setCreateError(caught instanceof Error ? caught.message : 'Unable to create the plan.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      {conflictPlan && (
        <div className="rounded-modal border border-error/50 bg-card p-5">
          <p className="text-sm font-semibold text-error">Edit conflict detected</p>
          <p className="mt-2 text-sm text-text-2">
            This plan was modified by your partner. Your changes may overwrite theirs.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => {
                // Force update by refetching
                window.location.reload()
              }}
              className="rounded-btn bg-accent-1 px-4 py-2 text-sm font-medium text-white"
            >
              Reload latest
            </button>
            <button
              type="button"
              onClick={() => setConflictPlan(null)}
              className="rounded-btn border border-border px-4 py-2 text-sm font-medium text-text-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-text-2">Shared plans</p>
          <h1 className="mt-2 text-3xl font-serif text-text-1">Our next chapters</h1>
        </div>
        <button type="button" onClick={() => { setCreateError(''); setCreateOpen(true) }} disabled={!coupleId} className="inline-flex items-center gap-2 rounded-full bg-accent-1 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">
          <Plus className="h-4 w-4" />
          New plan
        </button>
      </div>

      {loadError ? (
        <div className="rounded-btn border border-error/30 bg-error/10 p-4 text-sm text-error" role="alert">
          <p>{loadError}</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-2 font-semibold underline">Try again</button>
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading shared plans">
          <div className="h-8 w-40 animate-pulse rounded-full bg-soft-tint" />
          <div className="h-48 animate-pulse rounded-panel bg-card" />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            {plans.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title={coupleId ? 'No shared plans yet' : 'Link your partner to plan together'}
                description={coupleId ? 'Make your first plan together and keep its next steps in one place.' : 'Your shared plans will appear after both accounts are linked.'}
                action={coupleId ? { label: 'Create your first plan', onClick: () => setCreateOpen(true) } : undefined}
              />
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
                      className="h-full rounded-full bg-gradient-to-r from-accent-1 to-accent-2"
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

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="new-plan-title">
          <section className="w-full max-w-md rounded-modal border border-accent-1/20 bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 id="new-plan-title" className="text-xl font-semibold text-text-1">Create a shared plan</h2>
              <button type="button" onClick={() => setCreateOpen(false)} className="rounded-full px-2 py-1 text-text-2" aria-label="Close new plan">×</button>
            </div>
            <div className="mt-4 space-y-3">
              <label className="block text-sm text-text-2">Plan name
                <input autoFocus value={newTitle} onChange={(event) => setNewTitle(event.target.value)} className="mt-1 w-full rounded-xl border border-accent-1/20 bg-soft-tint px-3 py-2 text-text-1" maxLength={120} />
              </label>
              <label className="block text-sm text-text-2">Type
                <select value={newType} onChange={(event) => setNewType(event.target.value)} className="mt-1 w-full rounded-xl border border-accent-1/20 bg-soft-tint px-3 py-2 text-text-1">
                  <option value="goal">Shared goal</option><option value="date">Date plan</option><option value="trip">Trip</option><option value="home">Home</option><option value="other">Other</option>
                </select>
              </label>
              <label className="block text-sm text-text-2">Due date (optional)
                <input type="date" value={newDueDate} onChange={(event) => setNewDueDate(event.target.value)} className="mt-1 w-full rounded-xl border border-accent-1/20 bg-soft-tint px-3 py-2 text-text-1" />
              </label>
              {createError ? <p className="text-sm text-error" role="alert">{createError}</p> : null}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setCreateOpen(false)} className="rounded-xl border border-border px-4 py-2 text-sm text-text-2">Cancel</button>
                <button type="button" onClick={() => void createPlan()} disabled={!newTitle.trim() || creating} className="rounded-xl bg-accent-1 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{creating ? 'Creating…' : 'Create plan'}</button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
