function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
export default formatCurrency
