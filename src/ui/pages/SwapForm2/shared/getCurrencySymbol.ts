const cache = new Map<string, string>();

export function getCurrencySymbol(currency: string): string {
  const key = currency.toLowerCase();
  const cached = cache.get(key);
  if (cached) return cached;
  try {
    const parts = new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
    }).formatToParts(0);
    const symbol = parts.find((p) => p.type === 'currency')?.value ?? currency;
    cache.set(key, symbol);
    return symbol;
  } catch {
    cache.set(key, currency);
    return currency;
  }
}
