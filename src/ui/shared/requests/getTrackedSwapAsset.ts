import type { Fungible } from 'src/modules/zerion-api/types/Fungible';
import type { TrackedSwapAsset } from 'src/shared/types/QuoteErrorContext';

export function getTrackedSwapAsset(
  fungible: Fungible | null | undefined,
  fungibleId: string | null | undefined,
  chain: string | null | undefined,
  currency: string,
): TrackedSwapAsset | undefined {
  if (!fungible || fungible.id !== fungibleId) {
    return undefined;
  }
  const asset: TrackedSwapAsset = {
    name: fungible.name,
    address: chain ? (fungible.implementations[chain]?.address ?? null) : null,
  };
  if (currency.toLowerCase() === 'usd') {
    asset.usdPrice = fungible.meta.price;
    asset.usdMarketCap = fungible.meta.marketCap;
    asset.usdFdv = fungible.meta.fullyDilutedValuation;
  }
  return asset;
}
