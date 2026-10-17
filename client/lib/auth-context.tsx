'use client';

import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, deleteCookie, getCookie, setCookie } from './api';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role?: 'Cashier' | 'Admin' | 'Student';
  roles: ('Cashier' | 'Admin' | 'Student')[];
  status?: string;
  isAdmin?: boolean;
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    const token = getCookie('accessToken');
    if (!token) {
      setUser(null);
      setLoading(false);
      try {
        localStorage.removeItem('user');
      } catch (e) {}
      return;
    }
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    try {
      const response = await api.get('/auth/me');
      const userData = response.data?.data || response.data;
      if (userData && userData.roles && userData.roles.length > 0) {
        userData.role = userData.roles[0];
      }
      setUser(userData);
      try {
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (e) {}
    } catch (error: any) {
      if (error?.response?.status === 401) {
        setUser(null);
        deleteCookie('accessToken');
        try {
          localStorage.removeItem('user');
        } catch (e) {}
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: any) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', credentials);
      const { token, user: userData } = response.data.data;
      if (userData && userData.roles && userData.roles.length > 0) {
        userData.role = userData.roles[0];
      }
      setCookie('accessToken', token, 1);
      try {
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (e) {}
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      setLoading(false);
      router.push('/');
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const register = async (data: any) => {
    setLoading(true);
    try {
      await api.post('/auth/register', data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.delete('/auth/logout');
    } catch (error) {
      // Ignore logout errors
    } finally {
      deleteCookie('accessToken');
      try {
        localStorage.removeItem('user');
      } catch (e) {}
      setUser(null);
      setLoading(false);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
