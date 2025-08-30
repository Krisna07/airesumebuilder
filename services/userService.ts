

export class UserService {
    async createUser(email: string, password: string, name?: string) {
        try {
            const response = await fetch(`/api/user/newuser`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name }),
            });

            return response
        } catch (error) {
            throw error;
        }
    }

    async loginUser(email: string, password: string) {
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