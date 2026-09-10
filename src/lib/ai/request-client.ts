import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'

export function createRequestServerClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => undefined,
      },
    }
  )
}
