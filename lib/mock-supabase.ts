// Temporary mock Supabase client for local development
// This allows the app to run without a valid Supabase connection

const mockUser = {
    id: 'mock-user-id',
    email: 'test@example.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
}

export const createMockSupabaseClient = () => ({
    auth: {
        getUser: async () => ({
            data: { user: null },
            error: null
        }),
        signInWithPassword: async ({ email, password }: { email: string, password: string }) => {
            console.log('Mock sign in:', email)
            return {
                data: { user: mockUser, session: { user: mockUser } },
                error: null
            }
        },
        signUp: async ({ email, password }: { email: string, password: string }) => {
            console.log('Mock sign up:', email)
            return {
                data: { user: mockUser, session: null }, // Simulate email confirmation required
                error: null
            }
        },
        signOut: async () => ({
            error: null
        }),
        signInWithOAuth: async ({ provider }: { provider: string }) => {
            console.log('Mock OAuth sign in:', provider)
            return {
                data: { url: 'http://localhost:3001/dashboard' },
                error: null
            }
        },
        onAuthStateChange: (callback: Function) => {
            // Mock subscription
            return {
                data: {
                    subscription: {
                        unsubscribe: () => console.log('Mock unsubscribe')
                    }
                }
            }
        }
    }
})
