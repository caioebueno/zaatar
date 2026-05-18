import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

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
  loading: boolean;
  login: (token: string, driver: Driver) => Promise<void>;
  logout: () => Promise<void>;
};

const TOKEN_KEY  = 'zippy_driver_token';
const DRIVER_KEY = 'zippy_driver_info';

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token,   setToken]   = useState<string | null>(null);
  const [driver,  setDriver]  = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedDriver] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(DRIVER_KEY),
        ]);
        if (storedToken) setToken(storedToken);
        if (storedDriver) setDriver(JSON.parse(storedDriver) as Driver);
      } catch {
        // corrupted store — start fresh
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (t: string, d: Driver) => {
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY,  t),
      SecureStore.setItemAsync(DRIVER_KEY, JSON.stringify(d)),
    ]);
    setToken(t);
    setDriver(d);
  };

  const logout = async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(DRIVER_KEY),
    ]);
    setToken(null);
    setDriver(null);
  };

  return (
    <AuthContext.Provider value={{ token, driver, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
