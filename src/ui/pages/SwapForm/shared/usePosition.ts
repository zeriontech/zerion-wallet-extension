import { EmptyAddressPosition } from '@zeriontech/transactions';
import type { AddressPosition } from 'defi-sdk';
import { client, useAssetsPrices } from 'defi-sdk';
import { isTruthy } from 'is-truthy-ts';
import { useMemo } from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import type { Chain } from 'src/modules/networks/Chain';

export function usePosition({
  assetId,
  positions,
  chain,
}: {
  assetId: string | null;
  positions: AddressPosition[] | null;
  chain: Chain | null;
}) {
  const { currency } = useCurrency();
  const assetsPrices = useAssetsPrices(
    { asset_codes: [assetId].filter(isTruthy), currency },
    { client, enabled: Boolean(assetId) }
  );

  const asset = assetsPrices.value?.[assetId ?? ''] ?? null;

  const maybePosition = useMemo(
    () =>
      positions?.find(
        (p) =>
          p.asset.id === assetId &&
          p.chain === chain?.toString() &&
          p.type === 'asset'
      ) ?? null,
    [assetId, positions, chain]
  );

  return useMemo(() => {
    if (maybePosition) {
      return maybePosition;
    } else if (asset && chain) {
      return new EmptyAddressPosition({ asset, chain });
    } else {
      return null;
    }
  }, [asset, chain, maybePosition]);
}
