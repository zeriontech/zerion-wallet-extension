import { capitalize } from 'capitalize-ts';
import type { AddressPosition } from 'defi-sdk';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';

export function createAddressPosition({
  balance,
  network,
}: {
  balance: string;
  network: NetworkConfig;
}): AddressPosition {
  return {
    chain: network.id,
    value: null,
    apy: null,
    id: `${network.native_asset?.symbol}-${network.id}-asset`,
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
      name: network.native_asset?.name || `${capitalize(network.name)} Token`,
      symbol: network.native_asset?.symbol || '<unknown-symbol>',
      id:
        network.native_asset?.id ||
        network.native_asset?.symbol.toLowerCase() ||
        '<unknown-id>',
      asset_code:
        network.native_asset?.address ||
        network.native_asset?.symbol.toLowerCase() ||
        '<unknown-id>',
      decimals: Number(network.native_asset?.decimals) || NaN,
      icon_url: network.icon_url,
      is_verified: false,
      price: null,
      implementations: {
        [network.id]: {
          address: network.native_asset?.address ?? null,
          decimals: Number(network.native_asset?.decimals) || NaN,
        },
      },
    },
    parent_id: null,
  };
}
