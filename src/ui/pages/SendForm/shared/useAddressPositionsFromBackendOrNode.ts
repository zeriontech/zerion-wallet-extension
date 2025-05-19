import type { AddressPosition } from 'defi-sdk';
import { useMemo } from 'react';
import type { Chain } from 'src/modules/networks/Chain';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { useHttpAddressPositions } from 'src/modules/zerion-api/hooks/useWalletPositions';
import { useAddressPositionsFromNode } from 'src/ui/shared/requests/useAddressPositionsFromNode';
import { usePositionsRefetchInterval } from 'src/ui/transactions/usePositionsRefetchInterval';

export function useAddressPositionsFromBackendOrNode({
  address,
  currency,
  chain,
}: {
  address: string;
  currency: string;
  chain: Chain | null;
}): { data: AddressPosition[] | null | undefined; isLoading: boolean } {
  const { networks } = useNetworks();
  const hasChain = Boolean(chain);
  const isSupportedByBackend =
    chain && networks ? networks.supports('positions', chain) : null;
  const { data, isLoading } = useHttpAddressPositions(
    { addresses: [address], currency },
    { source: useHttpClientSource() },
    {
      // we query positions for all chains, so we can do it even before the "supported" check is ready
      enabled: hasChain && isSupportedByBackend === true,
      refetchInterval: usePositionsRefetchInterval(20000),
    }
  );
  const addressPositions = useMemo(
    () =>
      data?.data?.filter(
        (position) =>
          position.type === 'asset' && position.chain === chain?.toString()
      ),
    [chain, data?.data]
  );

  const evmQuery = useAddressPositionsFromNode({
    address,
    chain: chain as Chain,
    suspense: false,
    enabled: hasChain && isSupportedByBackend === false,
    staleTime: 1000 * 20,
  });

  return isSupportedByBackend === false
    ? { data: evmQuery.data, isLoading: evmQuery.isLoading }
    : { data: addressPositions, isLoading };
}
