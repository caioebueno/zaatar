export type AddItemPayload = {
  productId: string;
  quantity: number;
  modifierGroupItemIds: string[];
  comments: string | null;
  unitCents: number;
};

type Listener = (item: AddItemPayload) => void;
const listeners = new Set<Listener>();

export function emitAddItem(item: AddItemPayload): void {
  listeners.forEach(l => l(item));
}

export function subscribeDraftItem(cb: Listener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
