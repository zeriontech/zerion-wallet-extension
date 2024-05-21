import { useMemo } from 'react';
import type { Chain } from 'src/modules/networks/Chain';
import { baseToCommon } from 'src/shared/units/convert';
import BigNumber from 'bignumber.js';
import { getDecimals } from 'src/modules/networks/asset';
import { type AddressPosition, useAddressPositions } from 'defi-sdk';
import { isTruthy } from 'is-truthy-ts';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { useEvmNativeAddressPosition } from './useEvmNativeAddressPosition';
import { useNativeAssetId } from './useNativeAsset';

function useNativeAddressPosition({
  address,
  chain,
  enabled = true,
}: {
  address: string;
  chain: Chain;
  enabled?: boolean;
}) {
  const id = useNativeAssetId(chain);

  const { value, isLoading } = useAddressPositions(
    {
      address,
      assets: [id].filter(isTruthy),
      currency: 'usd',
    },
    { enabled: enabled && Boolean(id) }
  );

  return useMemo(() => {
    const nativePositions =
      value?.positions?.filter(
        (item) =>
          item.chain === chain.toString() &&
          item.type === 'asset' &&
          !item.protocol
      ) ?? [];
    if (nativePositions.length > 1) {
      console.warn('multiple native positions');
    }
    return {
      // ternary expression to correctly type accessor as nullable
      data: nativePositions.length ? nativePositions[0] : null,
      isLoading,
    };
  }, [chain, isLoading, value?.positions]);
}

export function useNativeBalance({
  address,
  chain,
  suspense,
  staleTime,
}: {
  address: string;
  chain: Chain;
  staleTime: number;
  suspense?: boolean;
}): {
  isLoading: boolean;
  data: { valueCommon: BigNumber | null; position: AddressPosition | null };
} {
  const { networks } = useNetworks();
  const isSupportedByBackend = networks
    ? networks.supports('positions', chain)
    : null;
  const nativeAddressPosition = useNativeAddressPosition({
    address,
    chain,
    enabled: isSupportedByBackend === true,
  });
  const evmNativeAddressPosition = useEvmNativeAddressPosition({
    address,
    chain,
    enabled: isSupportedByBackend === false,
    suspense,
    staleTime,
  });

  const isLoading =
    nativeAddressPosition.isLoading || evmNativeAddressPosition.isLoading;
  return useMemo(() => {
    const position =
      nativeAddressPosition.data || evmNativeAddressPosition.data;
    if (!position?.quantity) {
      return {
        data: { valueCommon: null, position: position || null },
        isLoading,
      };
    }

    const decimals = getDecimals({ asset: position.asset, chain });
    const value = baseToCommon(new BigNumber(position.quantity), decimals);
    return {
      data: { valueCommon: value, position },
      isLoading,
    };
  }, [
    nativeAddressPosition.data,
    evmNativeAddressPosition.data,
    chain,
    isLoading,
  ]);
}
