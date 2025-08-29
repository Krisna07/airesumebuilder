import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type User = {
  id: string;
  email: string;
  name?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ status: number; message: string }>;
  logout: () => void;
  register: (email: string, password: string, name?: string) => Promise<{ status: number; message: string }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from sessionStorage on mount
  useEffect(() => {
    setLoading(true);
    const stored = sessionStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data?.status !== 200) {
        return {
          status: data.status,
          message: data.error || 'Login failed'
        };
      }
      const userObj = {
        id: data.data.id,
        email: data.data.email,
        name: data.data.name
      };
      setUser(userObj);
      sessionStorage.setItem('user', JSON.stringify(userObj));
      return {
        status: 200,
        message: 'Login successful'
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('user');
  };

  const register = async (email: string, password: string, name?: string): Promise<{ status: number; message: string }> => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/newuser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });
      const data = await res.json();
      if (data.status !== 200) {
        const errorData = data;
        console.log(errorData);
        return {
          status: errorData.status,
          message: errorData.error || 'Registration failed'
        };
      }

      const userObj = {
        id: data.data.id,
        email: data.data.email,
        name: data.data.name
      };
      setUser(userObj);
      sessionStorage.setItem('user', JSON.stringify(userObj));
      return { status: 200, message: data.message };
    } finally {
      setLoading(false);
    }
  };

  return <AuthContext.Provider value={{ user, loading, login, logout, register }}>{children}</AuthContext.Provider>;
};
