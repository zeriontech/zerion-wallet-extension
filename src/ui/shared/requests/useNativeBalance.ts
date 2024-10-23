import { useMemo } from 'react';
import { type AddressPosition } from 'defi-sdk';
import type { Chain } from 'src/modules/networks/Chain';
import { baseToCommon } from 'src/shared/units/convert';
import BigNumber from 'bignumber.js';
import { getDecimals } from 'src/modules/networks/asset';
import { isTruthy } from 'is-truthy-ts';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useHttpAddressPositions } from 'src/modules/zerion-api/hooks/useWalletPositions';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { usePositionsRefetchInterval } from 'src/ui/transactions/usePositionsRefetchInterval';
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
  data: AddressPosition | null;
  isLoading: boolean;
  isSuccess: boolean;
} {
  const id = useNativeAssetId(chain);
  const { currency } = useCurrency();

  const {
    data: response,
    isLoading,
    isSuccess,
  } = useHttpAddressPositions(
    { addresses: [address], assetIds: [id].filter(isTruthy), currency },
    { source: useHttpClientSource() },
    {
      enabled: enabled && Boolean(id),
      refetchInterval: usePositionsRefetchInterval(false),
    }
  );

  return useMemo(() => {
    const nativePositions =
      response?.data?.filter(
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
      // ternary expression to correctly type accessor as nullable
      data: nativePositions.length ? nativePositions[0] : null,
      isLoading,
      isSuccess,
    };
  }, [chain, isLoading, isSuccess, response?.data]);
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
  const isSuccess =
    nativeAddressPosition.isSuccess || evmNativeAddressPosition.isSuccess;
  const position = nativeAddressPosition.data || evmNativeAddressPosition.data;
  return useMemo(() => {
    if (!position?.quantity) {
      if (isSuccess) {
        return {
          data: { valueCommon: new BigNumber(0), position: position || null },
          isLoading,
        };
      } else {
        return {
          data: { valueCommon: null, position: position || null },
          isLoading,
        };
      }
    }

    const decimals = getDecimals({ asset: position.asset, chain });
    const value = baseToCommon(new BigNumber(position.quantity), decimals);
    return {
      data: { valueCommon: value, position },
      isLoading,
    };
  }, [position, chain, isLoading, isSuccess]);
}
