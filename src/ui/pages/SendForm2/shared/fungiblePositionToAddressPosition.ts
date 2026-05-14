import type { AddressPosition } from 'defi-sdk';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import { commonToBase } from 'src/shared/units/convert';

export function fungiblePositionToAddressPosition(
  fp: FungiblePosition
): AddressPosition {
  const { fungible, amount, chain } = fp;
  const chainImpl = fungible.implementations[chain.id];
  const fallbackImpl = Object.values(fungible.implementations)[0];
  const decimals = chainImpl?.decimals ?? fallbackImpl?.decimals ?? 0;

  return {
    apy: null,
    asset: {
      id: fungible.id,
      asset_code: fungible.id,
      decimals,
      icon_url: fungible.iconUrl,
      name: fungible.name,
      symbol: fungible.symbol,
      type: null,
      is_displayable: true,
      is_verified: fungible.verified,
      price:
        fungible.meta.price != null
          ? {
              value: fungible.meta.price,
              relative_change_24h: fungible.meta.relativeChange1d ?? 0,
              changed_at: 0,
            }
          : null,
      implementations: fungible.implementations,
    },
    chain: chain.id,
    id: fp.id,
    included_in_chart: false,
    name: fungible.name,
    parent_id: null,
    protocol: null,
    quantity: commonToBase(amount.quantity, decimals).toFixed(0),
    type: 'asset',
    value: amount.value != null ? String(amount.value) : null,
    is_displayable: true,
    dapp: null,
  };
}
