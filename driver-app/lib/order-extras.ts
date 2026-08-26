import type { DispatchOrder } from './dispatch-api';

/**
 * Free items a driver must hand over beyond the paid products:
 * - discount-bar prizes (`progressiveDiscountSnapshot.selectedPrize`)
 * - redeemed FREE_PRODUCT loyalty rewards (`redeemedRewards`)
 */
export type ExtraItem = { qty: number; name: string; kind: 'prize' | 'reward' };

/** Prize/reward attention the driver must resolve at handoff (e.g. customer still picks a free item). */
export type AttentionNote = { title: string; detail: string };

const rewardIsLive = (status: string) => status !== 'EXPIRED' && status !== 'CANCELED';

/** Free items (chosen prizes + free-product rewards) to include in the delivery item list. */
export function orderExtras(order: DispatchOrder): ExtraItem[] {
  const out: ExtraItem[] = [];

  const prize = order.progressiveDiscountSnapshot?.selectedPrize ?? null;
  if (prize) {
    for (const pc of prize.selectedProductCounts) {
      if (pc.quantity <= 0) continue;
      out.push({
        qty: pc.quantity,
        name: prize.availableProducts.find((p) => p.id === pc.productId)?.name ?? prize.prizeName ?? 'Brinde',
        kind: 'prize',
      });
    }
  }

  for (const r of order.redeemedRewards ?? []) {
    if (r.type === 'FREE_PRODUCT' && r.product && rewardIsLive(r.status)) {
      out.push({ qty: r.quantity ?? 1, name: r.product.name, kind: 'reward' });
    }
  }

  return out;
}

/**
 * Prizes/rewards that need the driver's attention at delivery — the customer
 * still has to choose their free item(s), or a free reward has no product yet.
 */
export function prizeAttention(order: DispatchOrder): AttentionNote[] {
  const out: AttentionNote[] = [];

  const prize = order.progressiveDiscountSnapshot?.selectedPrize ?? null;
  if (prize && prize.quantity > 0) {
    const chosen = prize.selectedProductCounts.reduce((s, pc) => s + Math.max(0, pc.quantity), 0);
    if (chosen < prize.quantity) {
      out.push({ title: prize.prizeName || 'Brinde', detail: `Cliente escolhe ${prize.quantity - chosen} item(ns)` });
    }
  }

  for (const r of order.redeemedRewards ?? []) {
    if (r.type === 'FREE_PRODUCT' && !r.product && rewardIsLive(r.status)) {
      out.push({ title: r.title || 'Brinde', detail: 'Recompensa a confirmar na entrega' });
    }
  }

  return out;
}

export const hasPrizeAttention = (order: DispatchOrder): boolean => prizeAttention(order).length > 0;
