import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

const store = {
  get: (key: string) =>
    Platform.OS === 'web'
      ? Promise.resolve(localStorage.getItem(key))
      : SecureStore.getItemAsync(key),
  set: (key: string, value: string) =>
    Platform.OS === 'web'
      ? Promise.resolve(localStorage.setItem(key, value))
      : SecureStore.setItemAsync(key, value),
  delete: (key: string) =>
    Platform.OS === 'web'
      ? Promise.resolve(localStorage.removeItem(key))
      : SecureStore.deleteItemAsync(key),
};

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
          store.get(TOKEN_KEY),
          store.get(DRIVER_KEY),
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
      store.set(TOKEN_KEY,  t),
      store.set(DRIVER_KEY, JSON.stringify(d)),
    ]);
    setToken(t);
    setDriver(d);
  };

  const logout = async () => {
    await Promise.all([
      store.delete(TOKEN_KEY),
      store.delete(DRIVER_KEY),
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
