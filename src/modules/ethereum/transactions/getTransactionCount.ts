import { SLOW_MODE } from 'src/env/config';
import type { Chain } from 'src/modules/networks/Chain';
import type { Networks } from 'src/modules/networks/Networks';
import { sendRpcRequest } from 'src/shared/custom-rpc/rpc-request';
import { wait } from 'src/shared/wait';
import { valueToHex } from 'src/shared/units/valueToHex';
import { invariant } from 'src/shared/invariant';
import type { StoredTransactions } from './types';
import { getLatestLocallyKnownNonce } from './getLatestKnownNonce';

export async function getTransactionCount({
  address,
  chain,
  networks,
  defaultBlock = 'latest',
}: {
  address: string;
  chain: Chain;
  networks: Networks;
  defaultBlock?: 'latest' | 'earliest' | 'pending' | 'genesis';
}) {
  const url = networks.getRpcUrlInternal(chain);

  if (SLOW_MODE) {
    await wait(2000);
  }

  const { result } = await sendRpcRequest<string>(url, {
    method: 'eth_getTransactionCount',
    params: [address, defaultBlock],
  });
  return { value: result, source: new URL(url).origin };
}

export async function getBestKnownTransactionCount(
  state: StoredTransactions,
  params: Parameters<typeof getTransactionCount>[0]
): ReturnType<typeof getTransactionCount> {
  const transactionCount = await getTransactionCount(params);
  const { address, chain, networks } = params;
  const chainId = networks.getChainId(chain);
  invariant(chainId, 'Unable to find network info for generating the nonce');
  const latestNonce = getLatestLocallyKnownNonce({ state, address, chainId });
  const nonce = Math.max(latestNonce + 1, parseInt(transactionCount.value));
  return { ...transactionCount, value: valueToHex(nonce) };
}
