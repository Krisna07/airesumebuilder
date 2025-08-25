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
  register: (email: string, password: string, name?: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Load user from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const errorData = await res.json();
        return { status: res.status, message: errorData.error || 'Login failed' };
      }
      const data = await res.json();
      const userObj = { id: data.id, email: data.email, name: data.name };
      setUser(userObj);
      sessionStorage.setItem('user', JSON.stringify(userObj));
      return { status: 200, message: 'Login successful' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('user');
  };

  const register = async (email: string, password: string, name?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });
      if (!res.ok) throw new Error('Registration failed');
      const data = await res.json();
      const userObj = { id: data.id, email: data.email, name: data.name };
      setUser(userObj);
      sessionStorage.setItem('user', JSON.stringify(userObj));
    } finally {
      setLoading(false);
    }
  };

  return <AuthContext.Provider value={{ user, loading, login, logout, register }}>{children}</AuthContext.Provider>;
};
