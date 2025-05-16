import type { AddressPosition } from 'defi-sdk';
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
  const isSupportedByBackend =
    chain && networks ? networks.supports('positions', chain) : null;
  const { data, isLoading } = useHttpAddressPositions(
    { addresses: [address], currency },
    { source: useHttpClientSource() },
    {
      // we query positions for all chains, so we can do it even before the "supported" check is ready
      enabled: isSupportedByBackend == null || isSupportedByBackend,
      refetchInterval: usePositionsRefetchInterval(20000),
    }
  );
  const addressPositions = data?.data;

  const evmQuery = useAddressPositionsFromNode({
    address,
    chain: chain as Chain,
    suspense: false,
    enabled: isSupportedByBackend != null && !isSupportedByBackend,
    staleTime: 1000 * 20,
  });

  return isSupportedByBackend || isSupportedByBackend == null
    ? { data: addressPositions, isLoading }
    : { data: evmQuery.data, isLoading: evmQuery.isLoading };
}
