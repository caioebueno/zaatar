export const SALES_TAX_PERCENT = 6.5;
export const SALES_TAX_RATE = SALES_TAX_PERCENT / 100;

export const calculateSalesTaxInCents = (
  taxableAmountInCents: number,
): number => Math.round(Math.max(0, taxableAmountInCents) * SALES_TAX_RATE);
