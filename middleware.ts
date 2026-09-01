import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware to protect dashboard routes and check onboarding status.
// Uses cookies for auth and onboarding completion tracking.

export function middleware(req: NextRequest) {
  const { nextUrl, cookies } = req
  const pathname = nextUrl.pathname

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
    return NextResponse.next()
  }

  // Check authentication for protected routes
  const auth = cookies.get('a-little-world-with-us-auth')?.value
  const onboardingComplete = cookies.get('a-little-world-with-us-onboarding')?.value

  // If not authenticated, redirect to login
  if (auth !== 'true') {
    const url = new URL('/login', req.url)
    return NextResponse.redirect(url)
  }

  // If authenticated but onboarding not complete, redirect to onboarding
  // Skip onboarding check for the onboarding page itself
  if (onboardingComplete !== 'true' && !pathname.startsWith('/onboarding')) {
    const url = new URL('/onboarding', req.url)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
    '/vault/:path*',
    '/wellness/:path*',
    '/chat/:path*',
    '/gallery/:path*',
    '/memories/:path*',
    '/calendar/:path*',
    '/cycle/:path*',
    '/couple/:path*',
  ],
}
