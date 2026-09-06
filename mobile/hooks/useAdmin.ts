import { useEffect, useState } from 'react'

import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export function useAdmin() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const loadRole = async () => {
      if (!user) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      setIsAdmin(data?.role === 'admin')
      setLoading(false)
    }

    void loadRole()
  }, [user?.id])

  return { isAdmin, loading }
}
