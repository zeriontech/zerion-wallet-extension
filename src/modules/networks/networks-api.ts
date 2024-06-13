import { wait } from 'src/shared/wait';
import type { Client } from 'defi-sdk';
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

export function getNetworks({
  ids,
  client,
  include_testnets,
  supported_only = false,
}: {
  ids: string[] | null;
  client: Client;
  include_testnets: boolean;
  supported_only: boolean;
}): Promise<NetworkConfig[]> {
  return Promise.race([
    fetchChains(
      {
        ids: ids || undefined,
        include_testnets: Boolean(ids) || include_testnets,
        supported_only,
      },
      client
    ),
    ids
      ? rejectAfterDelay(CHAIN_INFO_TIMEOUT, `getNetworks(${ids.join()})`)
      : getNetworksFallback(),
  ]);
}

export async function getNetworkByChainId(chainId: string, client: Client) {
  const possibleNetworks = await Promise.race([
    getNetworksBySearch({ query: Number(chainId).toString(), client }),
    rejectAfterDelay(CHAIN_INFO_TIMEOUT, `getNetworkByChainId(${chainId})`),
  ]);
  const network = possibleNetworks.find(
    (item) => Networks.getChainId(item) === chainId
  );
  return network || null;
}
