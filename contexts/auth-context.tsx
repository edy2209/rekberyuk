import React, { createContext, useContext, useState, type ReactNode } from 'react';

export type UserRole = 'admin' | 'client';

export interface User {
  username: string;
  role: UserRole;
  displayName: string;
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => { success: boolean; message: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => ({ success: false, message: '' }),
  logout: () => {},
});

const DUMMY_USERS: Array<{
  username: string;
  password: string;
  role: UserRole;
  displayName: string;
  avatar: string;
}> = [
  { username: 'user123', password: 'user123', role: 'client', displayName: 'Budi Santoso', avatar: '👤' },
  { username: 'admin123', password: 'admin123', role: 'admin', displayName: 'Admin RekberYuk', avatar: '🛡️' },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (username: string, password: string) => {
    const found = DUMMY_USERS.find((u) => u.username === username && u.password === password);
    if (found) {
      setUser({
        username: found.username,
        role: found.role,
        displayName: found.displayName,
        avatar: found.avatar,
      });
      return { success: true, message: 'Login berhasil!' };
    }
    return { success: false, message: 'Username atau password salah' };
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
