import { createBrowserClient } from '@supabase/ssr'
import { createMockSupabaseClient } from './mock-supabase'

export function createClientSupabaseClient() {
    // Check if we have valid Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // If URL contains the invalid domain, use mock client
    if (supabaseUrl?.includes('cnljhinbhpvglmrvariw') || !supabaseUrl || !supabaseKey) {
        console.warn('Using mock Supabase client - please update your Supabase credentials')
        return createMockSupabaseClient() as any
    }

    return createBrowserClient(supabaseUrl, supabaseKey)
}
