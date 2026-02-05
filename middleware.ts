import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Add custom logic here if needed
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Allow access to auth pages and API routes
        if (pathname.startsWith('/auth/') || 
            pathname.startsWith('/api/auth/') ||
            pathname === '/') {
          return true
        }

        // Allow Clawdbot API routes (they use API key auth instead)
        if (pathname.startsWith('/api/clawdbot/')) {
          return true
        }

        // Allow Telegram API routes (they use API key auth and webhook secret)
        if (pathname.startsWith('/api/telegram/') ||
            pathname.startsWith('/api/webhooks/telegram')) {
          return true
        }

        // Allow WhatsApp API routes (they use API key auth and webhook secret)
        if (pathname.startsWith('/api/whatsapp/') ||
            pathname.startsWith('/api/webhooks/whatsapp')) {
          return true
        }

        // For other API routes, require authentication
        if (pathname.startsWith('/api/')) {
          return !!token
        }

        // For protected pages, require authentication
        if (pathname.startsWith('/bookmarks') || 
            pathname.startsWith('/todo') || 
            pathname.startsWith('/tags')) {
          return !!token
        }

        return true
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}