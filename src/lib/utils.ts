export function formatAmount(amount: number): string {
  if (!amount || isNaN(amount)) return "$0";
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

export function safeParseFloat(value: string | null | undefined): number {
  const num = parseFloat(value ?? "0");
  return isNaN(num) ? 0 : num;
}
