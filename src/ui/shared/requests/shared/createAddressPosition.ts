import { capitalize } from 'capitalize-ts';
import type { AddressPosition } from 'src/defi-sdk.types';
import type { NetworkInfo } from 'src/modules/networks/NetworkInfo';
import { getBaseAssetImplementation } from 'src/modules/networks/NetworkInfo';

export function createAddressPosition({
  balance,
  network,
}: {
  balance: string;
  network: NetworkInfo;
}): AddressPosition {
  const implementation = getBaseAssetImplementation(network);
  return {
    chain: network.id,
    value: null,
    apy: null,
    id: `${network.baseAsset?.symbol}-${network.id}-asset`,
    included_in_chart: false,
    name: 'Asset',
    quantity: balance,
    protocol: null,
    dapp: null,
    type: 'asset',
    is_displayable: true,
    asset: {
      is_displayable: true,
      type: null,
      name: network.baseAsset?.name || `${capitalize(network.name)} Token`,
      symbol: network.baseAsset?.symbol || '<unknown-symbol>',
      id:
        network.baseAsset?.id ||
        network.baseAsset?.symbol.toLowerCase() ||
        '<unknown-id>',
      asset_code:
        implementation?.address ||
        network.baseAsset?.symbol.toLowerCase() ||
        '<unknown-id>',
      decimals: Number(implementation?.decimals) || NaN,
      icon_url: network.baseAsset?.iconUrl || network.iconUrl || null,
      is_verified: false,
      price: null,
      implementations: {
        [network.id]: {
          address: implementation?.address ?? null,
          decimals: Number(implementation?.decimals) || NaN,
        },
      },
    },
    parent_id: null,
  };
}
