import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        // Redirect to the client-side auth handler
        const response = NextResponse.redirect(`${origin}/auth/confirm?code=${code}&next=${encodeURIComponent(next)}`)
        return response
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth?error=oauth_error`)
}
