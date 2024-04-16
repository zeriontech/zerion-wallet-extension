import type { AddressPosition } from 'defi-sdk';
import { useAddressPositions } from 'defi-sdk';
import type { Chain } from 'src/modules/networks/Chain';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { useEvmAddressPositions } from 'src/ui/shared/requests/useEvmAddressPositions';

export function useAddressBackendOrEvmPositions({
  address,
  currency,
  chain,
}: {
  address: string;
  currency: string;
  chain: Chain | null;
}): { data: AddressPosition[] | null | undefined; isLoading: boolean } {
  const { networks } = useNetworks();
  const isSupportedByBackend = !chain // backend address positions are returned for all supported chains
    ? true
    : networks
    ? networks.supports('positions', chain)
    : null;
  const { value: positionsValue, isLoading } = useAddressPositions(
    { address, currency },
    { enabled: isSupportedByBackend != null && isSupportedByBackend }
  );

  const evmQuery = useEvmAddressPositions({
    address,
    chain: chain as Chain,
    suspense: false,
    enabled: isSupportedByBackend != null && !isSupportedByBackend,
  });

  return isSupportedByBackend
    ? { data: positionsValue?.positions, isLoading }
    : { data: evmQuery.data, isLoading: evmQuery.isLoading };
}
