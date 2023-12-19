import { ethers } from 'ethers';
import { rejectAfterDelay } from 'src/shared/rejectAfterDelay';
import { getNetworksBySearch } from '../ethereum/chains/requests';
import { networksStore } from './networks-store.background';
import type { Chain } from './Chain';
import type { NetworkConfig } from './NetworkConfig';

function maybeLocalChainId(id: string) {
  return id.length === 21; // nanoid() standart length
}

async function getChainId(network?: NetworkConfig) {
  if (!network) {
    return null;
  }
  if (!maybeLocalChainId(network.id)) {
    return network;
  }
  try {
    const query = Number(network.external_id).toString();
    const possibleNetworks = await Promise.race([
      getNetworksBySearch({ query }),
      rejectAfterDelay(3000, `getNetworksBySearch(${query})`),
    ]);
    const networkFromBackend = possibleNetworks.find(
      (item) => item.external_id === network.external_id
    );
    return networkFromBackend ?? null;
  } catch {
    return null;
  }
}

export async function getBackendNetworkByLocalChain(chain: Chain) {
  const networks = await networksStore.load();
  const network = networks.getNetworkByName(chain);
  return getChainId(network);
}

export async function getBackendNetworkByChainId(chainId: string | number) {
  const networks = await networksStore.load();
  const network = networks.getNetworkById(ethers.utils.hexValue(chainId));
  return getChainId(network);
}
