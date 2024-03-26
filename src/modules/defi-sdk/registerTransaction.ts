import type { ethers } from 'ethers';
import { client } from 'defi-sdk';
import { networksStore } from '../networks/networks-store.background';
import { isCustomNetworkId } from '../ethereum/chains/helpers';

const namespace = 'transaction';
const scope = 'register';

export async function registerTransaction(
  transaction: ethers.providers.TransactionResponse
) {
  const networks = await networksStore.loadNetworksWithChainId(
    transaction.chainId
  );
  const network = networks.getNetworkById(transaction.chainId);

  if (isCustomNetworkId(network.id)) {
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
