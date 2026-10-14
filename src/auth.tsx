import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, loadSession, saveSession } from './lib/api';
import type { Session } from './types';

interface AuthValue {
  session: Session | null;
  login: (email: string, password: string) => Promise<Session>;
  register: (body: { email: string; password: string; full_name: string; phone: string; invite_code: string }) => Promise<Session>;
  logout: () => void;
}

const AuthContext = createContext<AuthValue>(null as unknown as AuthValue);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(loadSession());

  useEffect(() => {
    const onLogout = () => setSession(null);
    window.addEventListener('mn:logout', onLogout);
    return () => window.removeEventListener('mn:logout', onLogout);
  }, []);

  const start = (s: Session) => {
    saveSession(s);
    setSession(s);
    return s;
  };

  const value: AuthValue = {
    session,
    login: async (email, password) => start(await api.login(email, password)),
    register: async (body) => start(await api.register(body)),
    logout: () => {
      saveSession(null);
      setSession(null);
      window.location.hash = '/';
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
