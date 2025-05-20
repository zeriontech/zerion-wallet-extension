import type { AddressPosition } from 'defi-sdk';
import { useAssetsPrices } from 'defi-sdk';
import { isTruthy } from 'is-truthy-ts';
import { useMemo } from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useDefiSdkClient } from 'src/modules/defi-sdk/useDefiSdkClient';
import { useNetworkConfig } from 'src/modules/networks/useNetworks';
import { EmptyAddressPosition } from '@zeriontech/transactions';
import { createChain } from 'src/modules/networks/Chain';
import { createAddressPosition } from 'src/ui/shared/requests/shared/createAddressPosition';
import type { SendFormState } from './SendFormState';

export function useCurrentPosition(
  formState: SendFormState,
  positions: AddressPosition[]
) {
  const client = useDefiSdkClient();
  const { currency } = useCurrency();
  const { tokenAssetCode: assetCode, tokenChain } = formState;
  const { value: assetsPrices } = useAssetsPrices(
    { asset_codes: [assetCode].filter(isTruthy), currency },
    { client, keepStaleData: true, enabled: Boolean(assetCode) }
  );
  const { data: network } = useNetworkConfig(tokenChain ?? '', {
    enabled: Boolean(tokenChain),
  });

  const currentPosition = useMemo(() => {
    const item = positions.find((pos) => pos.asset.asset_code === assetCode);
    if (item) {
      return item;
    } else if (assetCode && tokenChain) {
      if (network?.supports_positions && assetsPrices?.[assetCode]) {
        // Only use assetsPrices response for backend-supported chains.
        // Otherwise EmptyAddressPosition will create asset with incorrect `implementations`
        return new EmptyAddressPosition({
          asset: assetsPrices[assetCode],
          chain: createChain(tokenChain),
        });
      } else if (network) {
        return createAddressPosition({ balance: '0', network });
      }
    }
  }, [assetCode, assetsPrices, network, positions, tokenChain]);
  return currentPosition ?? null;
}
