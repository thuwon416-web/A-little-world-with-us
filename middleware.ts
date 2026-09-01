import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware to protect dashboard routes server-side using a simple cookie set by client after PIN unlock.
// For production use a stronger server-side auth/session mechanism (JWT or secure session cookie).

export function middleware(req: NextRequest) {
  const { nextUrl, cookies } = req
  const pathname = nextUrl.pathname

  // Protect only dashboard routes and API routes that are client-facing
  if (pathname.startsWith('/dashboard')) {
    const auth = cookies.get('a-little-world-with-us-auth')?.value
    if (auth !== 'true') {
      const url = new URL('/login', req.url)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
