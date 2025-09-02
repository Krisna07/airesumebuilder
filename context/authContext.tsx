import { UserService } from '@/services/userService';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from './PopupContext';

type User = {
  id: string;
  email: string;
  name?: string;
};

const userService = new UserService();
type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => void;
  logout: () => void;
  register: (email: string, password: string, name?: string) => void;
};



const formValidation = async (email: string, password: string) => {
  switch (true) {
    case !password:
      return 'Password not provided';
    case password.length<6:
      return 'Password length requirement did not match'
    case !email:
      return 'Email not provided';
    case !email && !password:
      return 'Email and Password not added';
    default:
      break;
  }
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
  const toast = useToast();
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
    const error = await formValidation(email, password);
    if (error) {
      setLoading(false);
      return toast.showToast(error, 'warning', 3000);
    }

    const response = await userService.loginUser(email, password);

    const data = await response.json();
    if (!response.ok) {
      toast.showToast(data.error, 'error', 3000);
      return setLoading(false);
    }
    const userObj = data.data;
    sessionStorage.setItem('user', JSON.stringify(userObj));
    toast.showToast('Logging in', 'success', 3000);
    setLoading(false);
    return (window.location.href = '/builder');
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('user');
  };

  const register = async (email: string, password: string, name?: string) => {
    setLoading(true);
    const error = await formValidation(email, password);
    if (error) {
      setLoading(false);
      return toast.showToast(error, 'warning', 3000);
    }
    const response = await userService.createUser(email, password, name);
    const data = await response.json();
    if (!response.ok) {
      toast.showToast(data.error, 'error', 3000);
      return setLoading(false);
    }
    const userObj = data.data;
    sessionStorage.setItem('user', JSON.stringify(userObj));
    toast.showToast('User created successfully', 'success', 3000);
    setLoading(false);
    return (window.location.href = '/builder');
  };

  return <AuthContext.Provider value={{ user, loading, login, logout, register }}>{children}</AuthContext.Provider>;
};
