// import { createServerClient } from '@supabase/ssr'
// import { NextResponse, type NextRequest } from 'next/server'

export async function middleware() {
    // This middleware is used to handle authentication and authorization
    // for routes that require a logged-in user.

    // If you are using Supabase, you can uncomment the following lines
    // to create a Supabase client and check the user's authentication status.

    // const { createServerClient } = await import('@supabase/ssr')
    // const { NextResponse } = await import('next/server')
}
//     let supabaseResponse = NextResponse.next({
//         request,
//     })

//     const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
//     const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

//     if (!supabaseUrl || !supabaseKey) {
//         console.error('Missing Supabase credentials in middleware')
//         return supabaseResponse
//     }

//     const supabase = createServerClient(
//         supabaseUrl,
//         supabaseKey,
//         {
//             cookies: {
//                 getAll() {
//                     return request.cookies.getAll()
//                 },
//                 setAll(cookiesToSet) {
//                     cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
//                     supabaseResponse = NextResponse.next({
//                         request,
//                     })
//                     cookiesToSet.forEach(({ name, value, options }) =>
//                         supabaseResponse.cookies.set(name, value, options)
//                     )
//                 },
//             },
//         }
//     )

//     // IMPORTANT: Avoid writing any logic between createServerClient and
//     // supabase.auth.getUser(). A simple mistake could make it very hard to debug
//     // issues with users being randomly logged out.

//     let user = null
//     try {
//         const { data } = await supabase.auth.getUser()
//         user = data.user
//     } catch (error) {
//         console.error('Middleware: Error getting user:', error)
//         return supabaseResponse
//     }

//     // Protect routes that require authentication
//     const protectedRoutes = ['/dashboard', '/builder']
//     const isProtectedRoute = protectedRoutes.some(route =>
//         request.nextUrl.pathname.startsWith(route)
//     )

//     if (!user && isProtectedRoute) {
//         // Redirect unauthenticated users to auth page
//         const url = request.nextUrl.clone()
//         url.pathname = '/auth'
//         url.searchParams.set('redirect', request.nextUrl.pathname)
//         return NextResponse.redirect(url)
//     }

//     // Redirect authenticated users away from auth page (except callback and confirm pages)
//     if (user && request.nextUrl.pathname === '/auth') {
//         const redirectTo = request.nextUrl.searchParams.get('redirect') || '/dashboard'
//         const url = request.nextUrl.clone()
//         url.pathname = redirectTo
//         url.searchParams.delete('redirect')
//         return NextResponse.redirect(url)
//     }

//     // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
//     // creating a new response object with NextResponse.next() make sure to:
//     // 1. Pass the request in it, like so:
//     //    const myNewResponse = NextResponse.next({ request })
//     // 2. Copy over the cookies, like so:
//     //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
//     // 3. Change the myNewResponse object here instead of the supabaseResponse object

//     return supabaseResponse
// }

// export const config = {
//     matcher: [
//         /*
//          * Match all request paths except for the ones starting with:
//          * - _next/static (static files)
//          * - _next/image (image optimization files)
//          * - favicon.ico (favicon file)
//          * Feel free to modify this pattern to include more paths.
//          */
//         '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
//     ],
// }
