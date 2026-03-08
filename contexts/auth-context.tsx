import { authApi, getToken, removeToken, setToken } from '@/services/api';
import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  displayName: string;
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (username: string, password: string, displayName: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false, message: '' }),
  register: async () => ({ success: false, message: '' }),
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Cek token saat app dibuka → auto login
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getToken();
        if (token) {
          const me = await authApi.me();
          setUser({
            id: me.id,
            username: me.username,
            role: me.role as UserRole,
            displayName: me.displayName,
            avatar: me.avatar,
          });
        }
      } catch {
        await removeToken();
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await authApi.login(username, password);
      await setToken(res.token);
      setUser({
        id: res.id,
        username: res.username,
        role: res.role as UserRole,
        displayName: res.displayName,
        avatar: res.avatar,
      });
      return { success: true, message: 'Login berhasil!' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Login gagal' };
    }
  };

  const register = async (username: string, password: string, displayName: string) => {
    try {
      await authApi.register(username, password, displayName);
      return { success: true, message: 'Registrasi berhasil! Silakan login.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Registrasi gagal' };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // tetap logout meski API error
    } finally {
      await removeToken();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
