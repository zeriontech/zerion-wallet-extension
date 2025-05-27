import { SLOW_MODE } from 'src/env/config';
import { Networks } from 'src/modules/networks/Networks';
import { type NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { sendRpcRequest } from 'src/shared/custom-rpc/rpc-request';
import { wait } from 'src/shared/wait';
import { invariant } from 'src/shared/invariant';
import type { StoredTransactions } from './types';
import { getLatestLocallyKnownNonce } from './getLatestKnownNonce';

export async function getTransactionCount({
  address,
  network,
  defaultBlock = 'latest',
}: {
  address: string;
  network: NetworkConfig;
  defaultBlock?: 'latest' | 'earliest' | 'pending' | 'genesis';
}) {
  const url = Networks.getNetworkRpcUrlInternal(network);

  if (SLOW_MODE) {
    await wait(2000);
  }

  const { result } = await sendRpcRequest<string>(url, {
    method: 'eth_getTransactionCount',
    params: [address, defaultBlock],
  });
  return { value: parseInt(result), source: new URL(url).origin };
}

export async function getBestKnownTransactionCount(
  state: StoredTransactions,
  params: Parameters<typeof getTransactionCount>[0]
): ReturnType<typeof getTransactionCount> {
  const transactionCount = await getTransactionCount(params);
  const { address, network } = params;
  const chainId = Networks.getChainId(network);
  invariant(chainId, 'Unable to find network info for generating the nonce');
  const latestNonce = getLatestLocallyKnownNonce({ state, address, chainId });
  const nonce = Math.max(latestNonce + 1, transactionCount.value);
  return { ...transactionCount, value: nonce };
}
