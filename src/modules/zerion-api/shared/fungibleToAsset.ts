import type { Asset as DefiSdkAsset } from 'src/defi-sdk.types';
import type { Fungible } from '../types/Fungible';

export function fungibleToAsset(fungible: Fungible): DefiSdkAsset {
  return {
    id: fungible.id,
    asset_code: fungible.id,
    name: fungible.name,
    symbol: fungible.symbol,
    decimals: 18,
    icon_url: fungible.iconUrl,
    is_displayable: !fungible.new, // New assets might not be displayable by default
    is_verified: fungible.verified,
    type: null, // Fungible doesn't have a type field
    implementations: fungible.implementations,
    price:
      fungible.meta.price !== null
        ? {
            value: fungible.meta.price,
            relative_change_24h: fungible.meta.relativeChange1d ?? 0,
            changed_at: Date.now() / 1000, // Convert to seconds
          }
        : null,
  };
}
