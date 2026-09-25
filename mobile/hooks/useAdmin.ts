import { useEffect, useState } from 'react'

import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export function useAdmin() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let active = true
    const loadRole = async () => {
      if (!user) {
        if (active) {
          setIsAdmin(false)
          setLoading(false)
        }
        return
      }

      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()
        if (error) throw error
        if (active) setIsAdmin(data?.role === 'admin')
      } catch {
        // The app remains usable when the optional admin role check is unavailable.
        if (active) setIsAdmin(false)
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadRole()
    return () => {
      active = false
    }
  }, [user?.id])

  return { isAdmin, loading }
}
