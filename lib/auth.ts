import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabaseClient() {
    const cookieStore = await cookies()

    // Check if we have valid Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // If URL contains the invalid domain, return null (will be handled gracefully)
    if (supabaseUrl?.includes('cnljhinbhpvglmrvariw') || !supabaseUrl || !supabaseKey) {
        console.warn('Invalid Supabase credentials - please update your environment variables')
        throw new Error('Invalid Supabase configuration')
    }

    return createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )
}

export async function getCurrentUser() {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) {
            return null
        }

        return user
    } catch (error) {
        console.error('Error getting current user:', error)
        return null
    }
}

export async function requireAuth() {
    const user = await getCurrentUser()

    if (!user) {
        throw new Error('Authentication required')
    }

    return user
}
