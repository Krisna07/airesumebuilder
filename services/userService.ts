
export interface RegisterData {
    email: string | null;
    provider: string | null;
    id?: string;
    name?: string | null | undefined;
    image?: string | null | undefined;
    providerId?: string | null | undefined;
    password?: string | null | undefined;
}

export class UserService {
    static async createUser(user: RegisterData) {
        try {
            const userData = user
            if (user.provider === 'credentials') {
                if (!user.email || !user.password) {
                    throw new Error('Email and password are required for credentials signup.');
                }
            }

            const response = await fetch(`/api/auth/newuser`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });
            console.log(response)
            return response
        } catch (error) {
            throw error;
        }
    }

    static async loginUser(email: string, password: string) {
        try {
            const response = await fetch(`/api/user/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
           ;
            return response;
        } catch (error) {
            throw error;
        }
    }
}