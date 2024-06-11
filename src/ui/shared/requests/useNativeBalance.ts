import { useMemo } from 'react';
import { type AddressPosition, useAddressPositions } from 'defi-sdk';
import type { Chain } from 'src/modules/networks/Chain';
import { baseToCommon } from 'src/shared/units/convert';
import BigNumber from 'bignumber.js';
import { getDecimals } from 'src/modules/networks/asset';
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
}): {
  data: AddressPosition | undefined;
  isLoading: boolean;
  isSuccess: boolean;
} {
  const id = useNativeAssetId(chain);

  const { value, isLoading } = useAddressPositions(
    { address, assets: [id].filter(isTruthy), currency: 'usd' },
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
      // eslint-disable-next-line no-console
      console.warn('multiple native positions');
    }
    return {
      data: nativePositions[0],
      isLoading,
      isSuccess: Boolean(value?.positions),
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
  });

  const isLoading =
    nativeAddressPosition.isLoading || evmNativeAddressPosition.isLoading;
  const isSuccess =
    nativeAddressPosition.isSuccess || evmNativeAddressPosition.isSuccess;
  const position = nativeAddressPosition.data || evmNativeAddressPosition.data;
  return useMemo(() => {
    if (!position?.quantity) {
      if (isSuccess) {
        return { data: new BigNumber(0), isLoading };
      } else {
        return { data: null, isLoading };
      }
    }

    const decimals = getDecimals({ asset: position.asset, chain });
    const data = baseToCommon(new BigNumber(position.quantity), decimals);
    return {
      data,
      isLoading,
    };
  }, [position?.quantity, position?.asset, chain, isLoading, isSuccess]);
}
