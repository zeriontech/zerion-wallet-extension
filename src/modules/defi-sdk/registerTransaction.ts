import { ethers } from 'ethers';
import { client } from 'defi-sdk';
import { rejectAfterDelay } from 'src/shared/rejectAfterDelay';
import { getNetworksBySearch } from '../ethereum/chains/requests';
import { networksStore } from '../networks/networks-store.background';

function maybeLocalChainId(id: string) {
  return id.length === 21; // nanoid() standart length
}

const namespace = 'transaction';
const scope = 'register';

export async function registerTransaction(
  transaction: ethers.providers.TransactionResponse
) {
  const networks = await networksStore.load();
  const network = networks.getNetworkById(
    ethers.utils.hexValue(transaction.chainId)
  );

  try {
    let { id } = network;
    if (maybeLocalChainId(id)) {
      const query = Number(network.external_id).toString();
      const possibleNetworks = await Promise.race([
        getNetworksBySearch({ query }),
        rejectAfterDelay(3000, `getNetworksBySearch(${query})`),
      ]);
      const networkFromBackend = possibleNetworks.find(
        (item) => item.external_id === network.external_id
      );
      if (!networkFromBackend) {
        return;
      }
      id = networkFromBackend.id;
    }

    client.subscribe<object, typeof namespace, typeof scope>({
      method: 'get',
      namespace,
      body: {
        scope: [scope],
        payload: { hash: transaction.hash, chain: id },
      },
      onMessage: () => null,
    });
  } catch {
    // do nothing
  }
}
