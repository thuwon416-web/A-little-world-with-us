import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware to protect dashboard routes and check onboarding status.
// Uses Supabase server session verification for secure authentication.

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get user
  const { data: { user } } = await supabase.auth.getUser()

  // Check if user is authenticated
  const isAuthenticated = !!user

  const pathname = request.nextUrl.pathname

  // Skip middleware for public routes
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return supabaseResponse
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    const url = new URL('/login', request.url)
    return NextResponse.redirect(url)
  }

  // Check onboarding completion from the persisted user progress record rather than
  // untrusted auth user metadata.
  const { data: onboardingRecord } = await supabase
    .from('onboarding_progress')
    .select('data')
    .eq('user_id', user.id)
    .maybeSingle()

  const onboardingComplete = onboardingRecord?.data?.is_completed === true

  // If authenticated but onboarding not complete, redirect to onboarding
  // Skip onboarding check for the onboarding page itself
  if (!onboardingComplete && !pathname.startsWith('/onboarding')) {
    const url = new URL('/onboarding', request.url)
    return NextResponse.redirect(url)
  }

  // Supabase marks sessions that have an enrolled TOTP factor as requiring AAL2.
  // Keep private routes behind the second-factor challenge after password sign-in.
  if (!pathname.startsWith('/mfa')) {
    const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (assurance?.nextLevel === 'aal2' && assurance.currentLevel !== 'aal2') {
      const url = request.nextUrl.clone()
      url.pathname = '/mfa'
      url.search = ''
      const redirect = NextResponse.redirect(url)
      supabaseResponse.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
      return redirect
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
