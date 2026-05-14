import { createContext, useContext, useState, type ReactNode } from 'react';

export type Driver = {
  id: string;
  name: string;
  phone: string;
  active: boolean;
  priorityLevel: number;
};

type AuthState = {
  token: string | null;
  driver: Driver | null;
  login: (token: string, driver: Driver) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);

  return (
    <AuthContext.Provider
      value={{
        token,
        driver,
        login: (t, d) => { setToken(t); setDriver(d); },
        logout: () => { setToken(null); setDriver(null); },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
