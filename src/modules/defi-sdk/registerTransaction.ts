import { client } from 'defi-sdk';
import { rejectAfterDelay } from 'src/shared/rejectAfterDelay';
import type { NetworkConfig } from '../networks/NetworkConfig';
import { getNetworksBySearch } from '../ethereum/chains/requests';

function probablyLocalChainId(id: string) {
  return id.length === 21; // nanoid() standart length
}

const namespace = 'transaction';
const scope = 'register';

export async function registerTransaction(
  hash: string,
  network: NetworkConfig
) {
  try {
    let chain = network.id;
    if (probablyLocalChainId(chain)) {
      const possibleNetworks = await Promise.race([
        getNetworksBySearch({ query: Number(network.external_id).toString() }),
        rejectAfterDelay(3000),
      ]);
      const networkFromBackend = possibleNetworks.find(
        (network) => network.external_id === network.external_id
      );
      if (!networkFromBackend) {
        return;
      }
      chain = networkFromBackend.id;
    }

    client.subscribe<object, typeof namespace, typeof scope>({
      method: 'get',
      namespace,
      body: {
        scope: [scope],
        payload: { hash, chain },
      },
      onMessage: () => null,
    });
  } catch {
    // do nothing
  }
}
