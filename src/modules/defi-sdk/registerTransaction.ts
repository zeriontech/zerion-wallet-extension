import type { ethers } from 'ethers';
import { isCustomNetworkId } from '../ethereum/chains/helpers';
import { getDefiSdkClient } from './background';

const namespace = 'transaction';
const scope = 'register';

export async function registerTransaction(
  transaction: ethers.providers.TransactionResponse,
  chain: string,
  mode: 'default' | 'testnet'
) {
  if (isCustomNetworkId(chain)) {
    return;
  }
  const client = getDefiSdkClient({ on: mode === 'testnet' });

  client.subscribe<object, typeof namespace, typeof scope>({
    method: 'get',
    namespace,
    body: {
      scope: [scope],
      payload: { hash: transaction.hash, chain },
    },
    onMessage: () => null,
  });
}
