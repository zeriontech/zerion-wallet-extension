import { HTTPError } from 'ky';
import type { NetworksSource } from 'src/modules/zerion-api/shared';
import type { ChainFullInfo } from 'src/modules/zerion-api/types/ChainFullInfo';
import type { ZerionApiClient } from 'src/modules/zerion-api/zerion-api-bare';
import type { NetworkInfo } from './NetworkInfo';
import { Networks } from './Networks';
import { networksFallbackInfo } from './networks-fallback';

export interface NetworksApiParams {
  apiClient: ZerionApiClient;
  source: NetworksSource;
}

/**
 * {ChainFullInfo} is assignable to {NetworkInfo}; the only boundary work is
 * dropping chains whose standard the extension does not model (e.g. tron).
 */
function toNetworkInfos(chains: ChainFullInfo[]): NetworkInfo[] {
  return chains.filter((chain) => Networks.isSupportedEcosystem(chain));
}

function toNetworkInfo(chain: ChainFullInfo): NetworkInfo | null {
  return Networks.isSupportedEcosystem(chain) ? chain : null;
}

/**
 * The supported chain list for {source}. Testnets are included only for the
 * testnet source, matching what the socket's `supported_only` request returned.
 * The unfiltered list (~2.6k chains) is never fetched; chains outside this
 * list are looked up individually with {getNetworkByChainId} / {getNetworkById}.
 * Falls back to the bundled mainnet snapshot on failure — mainnet only, the
 * snapshot has no testnets.
 */
export async function getSupportedNetworks({
  apiClient,
  source,
}: NetworksApiParams): Promise<NetworkInfo[]> {
  try {
    const { data } = await apiClient.chainList(
      { supportedOnly: true, includeTestnets: source === 'testnet' },
      { source }
    );
    return toNetworkInfos(data);
  } catch (error) {
    if (source === 'testnet') {
      throw error;
    }
    return networksFallbackInfo;
  }
}

/** Exact lookup by EIP-155 chain id (hex or decimal string) */
export async function getNetworkByChainId(
  chainId: string,
  { apiClient, source }: NetworksApiParams
): Promise<NetworkInfo | null> {
  try {
    const { data } = await apiClient.chainGet(
      { eip155Id: Number(chainId) },
      { source }
    );
    return toNetworkInfo(data);
  } catch (error) {
    if (error instanceof HTTPError && error.response.status === 404) {
      return null; // unknown chain, not a failure
    }
    throw error;
  }
}

/**
 * Exact lookup by network id (slug). chain/list/v1 has no `ids` param and
 * `searchQuery` is a substring match, so the response is narrowed to the exact id.
 */
export async function getNetworkById(
  id: string,
  { apiClient, source }: NetworksApiParams
): Promise<NetworkInfo | null> {
  const { data } = await apiClient.chainList(
    { searchQuery: id, supportedOnly: false, includeTestnets: true },
    { source }
  );
  const chain = data.find((item) => item.id === id);
  return chain ? toNetworkInfo(chain) : null;
}

export async function getNetworksBySearch({
  query,
  includeTestnets,
  apiClient,
  source,
}: NetworksApiParams & {
  query: string;
  includeTestnets: boolean;
}): Promise<NetworkInfo[]> {
  const { data } = await apiClient.chainList(
    {
      searchQuery: query.trim().toLowerCase(),
      supportedOnly: false,
      includeTestnets,
    },
    { source }
  );
  return toNetworkInfos(data);
}
