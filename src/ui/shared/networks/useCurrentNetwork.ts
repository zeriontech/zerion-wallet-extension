import { useQuery } from 'react-query';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { walletPort } from '../channels';

export function useCurrentNetwork() {
  const { networks } = useNetworks();

  const { data: chainId, ...chainIdQuery } = useQuery('wallet/chainId', () =>
    walletPort.request('getChainId')
  );
  const name = chainId && networks ? networks.getChainNameById(chainId) : null;
  const network = chainId && networks ? networks.getNetworkById(chainId) : null;
  return {
    name,
    network,
    chainId,
    ...chainIdQuery,
  };
}
