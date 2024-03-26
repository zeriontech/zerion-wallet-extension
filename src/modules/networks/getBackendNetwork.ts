import { invariant } from 'src/shared/invariant';
import { networksStore } from './networks-store.background';
import type { Chain } from './Chain';
import type { NetworkConfig } from './NetworkConfig';
import { getNetworkByChainId } from './getNetworkByChainId';
import { getChainId } from './helpers';

function maybeLocalChainId(id: string) {
  return id.length === 21; // nanoid() standard length
}

async function fetchNetworkConfigIfSupported(network?: NetworkConfig) {
  if (!network) {
    return null;
  }
  if (!maybeLocalChainId(network.id)) {
    return network;
  }
  try {
    const chainId = getChainId(network);
    invariant(chainId, 'ChainId is required for network');
    const networkFromBackend = await getNetworkByChainId(chainId);
    return networkFromBackend ?? null;
  } catch {
    return null;
  }
}

export async function getBackendNetworkByLocalChain(chain: Chain) {
  const networks = await networksStore.load([chain.toString()]);
  const network = networks.getNetworkByName(chain);
  return fetchNetworkConfigIfSupported(network);
}

export async function getBackendNetworkByChainId(chainId: number) {
  const networks = await networksStore.loadNetworksWithChainId(chainId);
  const network = networks.getNetworkById(chainId);
  return fetchNetworkConfigIfSupported(network);
}
