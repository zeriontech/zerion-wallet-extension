import { wait } from 'src/shared/wait';
import { rejectAfterDelay } from 'src/shared/rejectAfterDelay';
import { fetchChains } from '../ethereum/chains/requests';
import type { NetworkConfig } from './NetworkConfig';
import { networksFallbackInfo } from './networks-fallback';

async function getNetworksFallback() {
  await wait(12000);
  return networksFallbackInfo;
}

export function getNetworks(ids?: string[]): Promise<NetworkConfig[]> {
  return Promise.race([
    fetchChains({ ids, include_testnets: Boolean(ids), supported_only: false }),
    ids ? rejectAfterDelay(12000, 'fetchChains') : getNetworksFallback(),
  ]);
}
