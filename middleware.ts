import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
    function middleware(req) {
        const { pathname } = req.nextUrl
        const token = req.nextauth.token

        // Define protected routes
        const protectedRoutes = ['/dashboard', '/api/resume', '/api/user']
        const isProtectedRoute = protectedRoutes.some(route =>
            pathname.startsWith(route)
        )

        // If accessing a protected route without authentication
        if (isProtectedRoute && !token) {
            const url = req.nextUrl.clone()
            url.pathname = '/auth'
            url.searchParams.set('callbackUrl', pathname)
            return NextResponse.redirect(url)
        }

        // If authenticated user tries to access auth page, redirect to dashboard
        if (token && pathname.startsWith('/auth')) {
            const callbackUrl = req.nextUrl.searchParams.get('callbackUrl')
            const url = req.nextUrl.clone()
            url.pathname = callbackUrl || '/dashboard'
            url.searchParams.delete('callbackUrl')
            return NextResponse.redirect(url)
        }

        // Allow the request to continue
        return NextResponse.next()
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const { pathname } = req.nextUrl

                // Always allow access to public routes
                const publicRoutes = ['/auth', '/api/auth', '/', '/not-found']
                if (publicRoutes.some(route => pathname.startsWith(route)) || pathname === '/') {
                    return true
                }

                // For protected routes, require a token
                const protectedRoutes = ['/dashboard', '/api/resume', '/api/user']
                if (protectedRoutes.some(route => pathname.startsWith(route))) {
                    return !!token
                }

                // Allow all other routes
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
         * - public files (svg, png, jpg, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
