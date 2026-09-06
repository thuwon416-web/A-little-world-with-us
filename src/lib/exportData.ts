import { supabase } from './supabase'

export async function exportUserData(userId: string) {
  try {
    // Fetch all user data
    const [memories, rituals, messages, todos] = await Promise.all([
      supabase.from('memories').select('*').eq('user_id', userId),
      supabase.from('rituals').select('*').eq('user_id', userId),
      supabase.from('messages').select('*').eq('user_id', userId),
      supabase.from('todos').select('*').eq('user_id', userId),
    ])

    const exportData = {
      exportedAt: new Date().toISOString(),
      userId,
      memories: memories.data || [],
      rituals: rituals.data || [],
      messages: messages.data || [],
      todos: todos.data || [],
    }

    // Create downloadable JSON
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `our-little-world-data-${userId}.json` 
    a.click()
    
    URL.revokeObjectURL(url)

    return { success: true }
  } catch (error) {
    console.error('Export error:', error)
    return { success: false, error }
  }
}

export async function deleteUserData(userId: string) {
  try {
    await Promise.all([
      supabase.from('memories').delete().eq('user_id', userId),
      supabase.from('rituals').delete().eq('user_id', userId),
      supabase.from('messages').delete().eq('user_id', userId),
      supabase.from('todos').delete().eq('user_id', userId),
    ])

    return { success: true }
  } catch (error) {
    console.error('Delete error:', error)
    return { success: false, error }
  }
}
