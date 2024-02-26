import type { ethers } from 'ethers';
import { client } from 'defi-sdk';
import { getBackendNetworkByChainId } from '../networks/getBackendNetwork';

const namespace = 'transaction';
const scope = 'register';

export async function registerTransaction(
  transaction: ethers.providers.TransactionResponse
) {
  const network = await getBackendNetworkByChainId(transaction.chainId);

  if (!network) {
    return;
  }

  client.subscribe<object, typeof namespace, typeof scope>({
    method: 'get',
    namespace,
    body: {
      scope: [scope],
      payload: { hash: transaction.hash, chain: network.id },
    },
    onMessage: () => null,
  });
}
