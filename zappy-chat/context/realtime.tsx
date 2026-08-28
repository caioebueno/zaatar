import { createContext, useContext, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { SSEClient, type ChatwootRealtimeEvent, type EventHandler } from '../lib/realtime';
import { useAuth } from './auth';

type RealtimeContextValue = {
  subscribe: (handler: EventHandler) => () => void;
};

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { token, businessId, branchId: storedBranchId } = useAuth();
  const branchId = storedBranchId ?? 'f27dacf2-e11d-4cde-9d02-a50431a19fef';
  // Handler registry outlives individual SSEClient instances
  const handlersRef = useRef(new Set<EventHandler>());

  useEffect(() => {
    if (!token || !branchId) return;

    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (businessId) headers['x-business-id'] = businessId;

    const client = new SSEClient(branchId, headers);

    const bridge: EventHandler = (event) => {
      handlersRef.current.forEach(h => h(event));
    };

    client.addHandler(bridge);
    client.connect();

    return () => {
      client.removeHandler(bridge);
      client.destroy();
    };
  }, [token, businessId, branchId]);

  const subscribe = useCallback((handler: EventHandler): (() => void) => {
    handlersRef.current.add(handler);
    return () => { handlersRef.current.delete(handler); };
  }, []);

  return (
    <RealtimeContext.Provider value={{ subscribe }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('useRealtime must be used within RealtimeProvider');
  return ctx;
}
