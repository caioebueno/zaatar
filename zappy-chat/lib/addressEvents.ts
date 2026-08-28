import type { DeliveryAddress } from './api';

type Listener = (address: DeliveryAddress) => void;
const listeners = new Set<Listener>();

export function emitNewAddress(address: DeliveryAddress): void {
  listeners.forEach(l => l(address));
}

export function subscribeNewAddress(cb: Listener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
