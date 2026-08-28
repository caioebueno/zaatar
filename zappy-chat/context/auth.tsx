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

export type Agent = {
  id: string;
  name: string;
  phone: string | null;
};

type AuthState = {
  token: string | null;
  agent: Agent | null;
  businessId: string | null;
  branchId: string | null;
  loading: boolean;
  login: (token: string, agent: Agent, businessId: string | null, branchId: string | null) => Promise<void>;
  logout: () => Promise<void>;
};

const TOKEN_KEY      = 'zippy_agent_token';
const AGENT_KEY      = 'zippy_agent_info';
const BUSINESS_KEY   = 'zippy_agent_businessId';
const BRANCH_KEY     = 'zippy_agent_branchId';

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token,      setToken]      = useState<string | null>(null);
  const [agent,      setAgent]      = useState<Agent | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [branchId,   setBranchId]   = useState<string | null>(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedAgent, storedBusiness, storedBranch] = await Promise.all([
          store.get(TOKEN_KEY),
          store.get(AGENT_KEY),
          store.get(BUSINESS_KEY),
          store.get(BRANCH_KEY),
        ]);
        if (storedToken)   setToken(storedToken);
        if (storedAgent)   setAgent(JSON.parse(storedAgent) as Agent);
        if (storedBusiness) setBusinessId(storedBusiness);
        if (storedBranch)   setBranchId(storedBranch);
      } catch {
        // corrupted store — start fresh
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (t: string, a: Agent, biz: string | null, branch: string | null) => {
    await Promise.all([
      store.set(TOKEN_KEY, t),
      store.set(AGENT_KEY, JSON.stringify(a)),
      biz    ? store.set(BUSINESS_KEY, biz)    : store.delete(BUSINESS_KEY),
      branch ? store.set(BRANCH_KEY, branch)   : store.delete(BRANCH_KEY),
    ]);
    setToken(t);
    setAgent(a);
    setBusinessId(biz);
    setBranchId(branch);
  };

  const logout = async () => {
    await Promise.all([
      store.delete(TOKEN_KEY),
      store.delete(AGENT_KEY),
      store.delete(BUSINESS_KEY),
      store.delete(BRANCH_KEY),
    ]);
    setToken(null);
    setAgent(null);
    setBusinessId(null);
    setBranchId(null);
  };

  return (
    <AuthContext.Provider value={{ token, agent, businessId, branchId, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
