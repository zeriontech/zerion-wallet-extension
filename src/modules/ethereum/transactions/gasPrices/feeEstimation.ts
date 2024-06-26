import memoize from 'lodash/memoize';
import { getNetworksStore } from 'src/modules/networks/networks-store.client';
import { invariant } from 'src/shared/invariant';
import { getTransactionCount } from '../getTransactionCount';
import type { ChainId } from '../ChainId';
import { estimateNetworkFee } from './estimateNetworkFee';

const fetchNonce = memoize(async (address: string, chainId: ChainId) => {
  const networksStore = await getNetworksStore();
  const networks = await networksStore.loadNetworksByChainId(chainId);
  const chain = chainId ? networks.getChainById(chainId) : null;
  invariant(chain, `Chain not found for ${chainId}`);
  const { value } = await getTransactionCount({ address, chain, networks });
  return parseInt(value);
});

type EstimateNetworkFeeFn = typeof estimateNetworkFee;

export async function getNetworkFeeEstimation(
  params: Omit<Parameters<EstimateNetworkFeeFn>[0], 'getNonce'>
): ReturnType<EstimateNetworkFeeFn> {
  return estimateNetworkFee({ ...params, getNonce: fetchNonce });
}
