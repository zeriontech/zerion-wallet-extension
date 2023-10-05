import { useMemo } from 'react';
import type { Chain } from 'src/modules/networks/Chain';
import { baseToCommon } from 'src/shared/units/convert';
import BigNumber from 'bignumber.js';
import { getDecimals } from 'src/modules/networks/asset';
import { useAddressPositions } from 'defi-sdk';
import { isTruthy } from 'is-truthy-ts';
import { useEvmNativeAddressPosition } from './useEvmNativeAddressPosition';
import { useNativeAssetId } from './useNativeAsset';

function useNativeAddressPosition({
  address,
  chain,
}: {
  address: string;
  chain: Chain;
}) {
  const id = useNativeAssetId(chain);
  const { value, isLoading } = useAddressPositions(
    {
      address,
      assets: [id].filter(isTruthy),
      currency: 'usd',
    },
    { enabled: Boolean(id) }
  );

  return useMemo(() => {
    return {
      data: value?.positions?.find(
        (item) => item.chain === chain.toString() && item.type === 'asset'
      ),
      isLoading,
    };
  }, [chain, isLoading, value?.positions]);
}

export function useNativeBalance({
  address,
  chain,
}: {
  address: string;
  chain: Chain;
}) {
  const nativeAddressPosition = useNativeAddressPosition({ address, chain });
  const evmNativeAddressPosition = useEvmNativeAddressPosition({
    address,
    chain,
    enabled:
      !nativeAddressPosition.isLoading && !nativeAddressPosition.data?.quantity,
  });

  const isLoading =
    nativeAddressPosition.isLoading || evmNativeAddressPosition.isLoading;
  return useMemo(() => {
    const position =
      nativeAddressPosition.data || evmNativeAddressPosition.data;
    if (!position?.quantity) {
      return { data: null, isLoading };
    }

    const decimals = getDecimals({ asset: position.asset, chain });
    const data = baseToCommon(new BigNumber(position.quantity), decimals);
    return {
      data,
      isLoading,
    };
  }, [
    nativeAddressPosition.data,
    evmNativeAddressPosition.data,
    chain,
    isLoading,
  ]);
}
