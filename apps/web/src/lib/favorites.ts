/**
 * Favorites / Gift Data Management
 */

import { supabase } from './supabase'

export type FavoriteCategory = 'size' | 'wishlist' | 'gift_ideas' | 'favorites'

export interface FavoriteItem {
  id: string
  user_id: string
  couple_id: string | null
  category: FavoriteCategory
  item_name: string
  item_value: string | null
  item_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export async function getFavorites(category?: FavoriteCategory): Promise<FavoriteItem[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let query = supabase
    .from('favorites')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query
  if (error) return []

  return (data || []) as FavoriteItem[]
}

export async function getPartnerFavorites(category?: FavoriteCategory): Promise<FavoriteItem[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase
    .from('profiles')
    .select('couple_id')
    .eq('id', user.id)
    .single()

  if (!profile?.couple_id) return []

  let query = supabase
    .from('favorites')
    .select('*')
    .eq('couple_id', profile.couple_id)
    .neq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query
  if (error) return []

  return (data || []) as FavoriteItem[]
}

export async function addFavorite(
  category: FavoriteCategory,
  item_name: string,
  item_value?: string,
  item_url?: string,
  notes?: string
): Promise<FavoriteItem> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('couple_id')
    .eq('id', user.id)
    .single()

  const { data, error } = await supabase
    .from('favorites')
    .insert({
      user_id: user.id,
      couple_id: profile?.couple_id || null,
      category,
      item_name,
      item_value: item_value || null,
      item_url: item_url || null,
      notes: notes || null,
    })
    .select()
    .single()

  if (error) throw error
  return data as FavoriteItem
}

export async function updateFavorite(
  id: string,
  updates: Partial<FavoriteItem>
): Promise<FavoriteItem> {
  const { data, error } = await supabase
    .from('favorites')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as FavoriteItem
}

export async function deleteFavorite(id: string): Promise<void> {
  const { error } = await supabase.from('favorites').delete().eq('id', id)
  if (error) throw error
}
