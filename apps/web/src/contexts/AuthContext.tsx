import React, { createContext, useContext, useState, useCallback } from 'react';
import type { User } from '@team-tracker/shared';
import { authApi, saveToken, clearToken, getSavedUser, saveUser } from '../api.ts';

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(getSavedUser);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    saveToken(response.token);
    saveUser(response.user);
    setUser(response.user);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
