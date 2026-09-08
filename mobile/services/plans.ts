import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export type PlanType = 'date' | 'trip' | 'goal' | 'life' | 'other'
export type PlanStatus = 'active' | 'completed' | 'archived'

export interface PlanItemRecord {
  id: string
  plan_id: string
  title: string
  completed: boolean
  created_at: string
}

export interface PlanRecord {
  id: string
  couple_id: string
  title: string
  description: string | null
  type: PlanType | string
  due_date: string | null
  status: PlanStatus | string
  created_at: string
  plan_items?: PlanItemRecord[]
}

export interface BucketListRecord {
  id: string
  couple_id: string
  item: string
  completed: boolean
  completed_at: string | null
  created_at: string
}

async function getCoupleId() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  const { data, error } = await supabase
    .from('couple_links')
    .select('couple_id')
    .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
    .eq('status', 'accepted')
    .not('couple_id', 'is', null)
    .maybeSingle()
  if (error || !data?.couple_id) throw new Error('No accepted couple is linked to this account.')
  return data.couple_id
}

export async function getPlans(): Promise<PlanRecord[]> {
  if (!isSupabaseConfigured) {
    return []
  }

  const { data, error } = await supabase
    .from('plans')
    .select('*, plan_items(*)')
    .eq('couple_id', await getCoupleId())
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as PlanRecord[]
}

export async function createPlan(payload: {
  title: string
  description?: string
  type?: PlanType | string
  due_date?: string | null
  status?: PlanStatus | string
}) {
  if (!isSupabaseConfigured) {
    return null
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('plans')
    .insert({
      couple_id: await getCoupleId(),
      user_id: user.id,
      title: payload.title,
      description: payload.description ?? null,
      type: payload.type ?? 'goal',
      due_date: payload.due_date ?? null,
      status: payload.status ?? 'active',
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as PlanRecord | null
}

export async function updatePlan(
  planId: string,
  updates: Partial<Pick<PlanRecord, 'title' | 'description' | 'type' | 'due_date' | 'status'>>
) {
  if (!isSupabaseConfigured) {
    return null
  }

  const { data, error } = await supabase
    .from('plans')
    .update(updates)
    .eq('id', planId)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as PlanRecord | null
}

export async function deletePlan(planId: string) {
  if (!isSupabaseConfigured) {
    return true
  }

  const { error } = await supabase.from('plans').delete().eq('id', planId)

  if (error) {
    throw new Error(error.message)
  }

  return true
}

export async function addPlanItem(planId: string, title: string) {
  if (!isSupabaseConfigured) {
    return null
  }

  const { data, error } = await supabase
    .from('plan_items')
    .insert({ plan_id: planId, title, completed: false })
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as PlanItemRecord | null
}

export async function togglePlanItem(planId: string, itemId: string, completed: boolean) {
  if (!isSupabaseConfigured) {
    return null
  }

  const { data, error } = await supabase
    .from('plan_items')
    .update({ completed })
    .eq('id', itemId)
    .eq('plan_id', planId)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as PlanItemRecord | null
}

export async function getBucketList(): Promise<BucketListRecord[]> {
  if (!isSupabaseConfigured) {
    return []
  }

  const { data, error } = await supabase
    .from('bucket_list')
    .select('*')
    .eq('couple_id', await getCoupleId())
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as BucketListRecord[]
}

export async function addBucketItem(item: string) {
  if (!isSupabaseConfigured) {
    return null
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('bucket_list')
    .insert({
      couple_id: await getCoupleId(),
      user_id: user.id,
      item,
      completed: false,
      completed_at: null,
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as BucketListRecord | null
}

export async function toggleBucketItem(itemId: string, completed: boolean) {
  if (!isSupabaseConfigured) {
    return null
  }

  const { data, error } = await supabase
    .from('bucket_list')
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', itemId)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as BucketListRecord | null
}
