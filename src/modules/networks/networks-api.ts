import { wait } from 'src/shared/wait';
import { rejectAfterDelay } from 'src/shared/rejectAfterDelay';
import { fetchChains, getNetworksBySearch } from '../ethereum/chains/requests';
import type { NetworkConfig } from './NetworkConfig';
import { networksFallbackInfo } from './networks-fallback';
import { Networks } from './Networks';

const CHAIN_INFO_TIMEOUT = 12000;

async function getNetworksFallback() {
  await wait(CHAIN_INFO_TIMEOUT);
  return networksFallbackInfo;
}

export function getNetworks(ids?: string[]): Promise<NetworkConfig[]> {
  return Promise.race([
    fetchChains({ ids, include_testnets: Boolean(ids), supported_only: false }),
    ids
      ? rejectAfterDelay(CHAIN_INFO_TIMEOUT, `getNetworks(${ids.join()})`)
      : getNetworksFallback(),
  ]);
}

export async function getNetworkByChainId(chainId: string) {
  const possibleNetworks = await Promise.race([
    getNetworksBySearch({ query: Number(chainId).toString() }),
    rejectAfterDelay(CHAIN_INFO_TIMEOUT, `getNetworkByChainId(${chainId})`),
  ]);
  const network = possibleNetworks.find(
    (item) => Networks.getChainId(item) === chainId
  );
  return network || null;
}
