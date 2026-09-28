import { useMemo } from 'react';
import type { AddressPosition } from 'src/defi-sdk.types';
import type { Chain } from 'src/modules/networks/Chain';
import { baseToCommon } from 'src/shared/units/convert';
import BigNumber from 'bignumber.js';
import { getDecimals } from 'src/modules/networks/asset';
import { useNetworkInfo } from 'src/modules/networks/useNetworks';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useWalletSimplePositions } from 'src/modules/zerion-api/hooks/useWalletSimplePositions';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { usePositionsRefetchInterval } from 'src/ui/transactions/usePositionsRefetchInterval';
import { useAddressPositionFromRpcNode } from './useAddressPositionsFromNode';
import { fungiblePositionToAddressPosition } from './shared/fungiblePositionToAddressPosition';
import { useNativeAssetId } from './useNativeAsset';

/**
 * The wallet's native holding on one chain, read from Simple Positions: a
 * chain-exact amount, which a Grouped Position (summed across chains) can't
 * give. One list per wallet serves every chain and every network-picker row.
 */
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
  } = useWalletSimplePositions(
    { address, currency },
    { source: useHttpClientSource() },
    {
      enabled: enabled && Boolean(id),
      refetchInterval: usePositionsRefetchInterval(false),
    }
  );

  return useMemo(() => {
    const nativePositions =
      response?.data?.filter(
        (item) => item.chain.id === chain.toString() && item.fungible.id === id
      ) ?? [];
    if (nativePositions.length > 1) {
      // eslint-disable-next-line no-console
      console.warn('multiple native positions');
    }
    return {
      // ternary expression to correctly type accessor as nullable
      data: nativePositions.length
        ? fungiblePositionToAddressPosition(nativePositions[0])
        : null,
      isLoading,
      isSuccess,
    };
  }, [chain, id, isLoading, isSuccess, response?.data]);
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
  const { data: network } = useNetworkInfo(chain.toString(), { suspense });
  const isSupportedByBackend = network?.flags.supportsPositions;
  const nativeAddressPosition = useNativeAddressPosition({
    address,
    chain,
    enabled: isSupportedByBackend === true,
  });
  const positionFromRpcNodeQuery = useAddressPositionFromRpcNode({
    address,
    chain,
    enabled: isSupportedByBackend === false,
    suspense,
    staleTime,
  });

  const isLoading =
    nativeAddressPosition.isLoading || positionFromRpcNodeQuery.isLoading;
  const isSuccess =
    nativeAddressPosition.isSuccess || positionFromRpcNodeQuery.isSuccess;
  const position = nativeAddressPosition.data || positionFromRpcNodeQuery.data;
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
