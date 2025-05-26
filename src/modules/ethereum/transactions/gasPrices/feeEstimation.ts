import memoize from 'lodash/memoize';
import { getNetworksStore } from 'src/modules/networks/networks-store.client';
import { getTransactionCount } from '../getTransactionCount';
import type { ChainId } from '../ChainId';
import { estimateNetworkFee } from './estimateNetworkFee';

const fetchNonce = memoize(async (address: string, chainId: ChainId) => {
  const networksStore = await getNetworksStore();
  const network = await networksStore.fetchNetworkByChainId(chainId);
  const { value } = await getTransactionCount({ address, network });
  return value;
});

type EstimateNetworkFeeFn = typeof estimateNetworkFee;

export async function getNetworkFeeEstimation(
  params: Omit<Parameters<EstimateNetworkFeeFn>[0], 'getNonce'>
): ReturnType<EstimateNetworkFeeFn> {
  return estimateNetworkFee({ ...params, getNonce: fetchNonce });
}
