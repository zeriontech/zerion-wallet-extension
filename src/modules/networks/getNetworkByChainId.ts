import { rejectAfterDelay } from 'src/shared/rejectAfterDelay';
import { getNetworksBySearch } from '../ethereum/chains/requests';
import { getChainId } from './helpers';

export async function getNetworkByChainId(chainId: number) {
  const possibleNetworks = await Promise.race([
    getNetworksBySearch({ query: chainId.toString() }),
    rejectAfterDelay(3000, `getNetworksBySearch(${chainId})`),
  ]);
  const network = possibleNetworks.find((item) => getChainId(item) === chainId);
  return network || null;
}
