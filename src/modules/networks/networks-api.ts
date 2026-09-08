import { HTTPError } from 'ky';
import { isTruthy } from 'is-truthy-ts';
import { chainFullInfoToNetworkConfig } from 'src/modules/zerion-api/requests/chainFullInfoToNetworkConfig';
import type { NetworksSource } from 'src/modules/zerion-api/shared';
import type { ChainFullInfo } from 'src/modules/zerion-api/types/ChainFullInfo';
import type { ZerionApiClient } from 'src/modules/zerion-api/zerion-api-bare';
import type { NetworkConfig } from './NetworkConfig';
import { networksFallbackInfo } from './networks-fallback';

export interface NetworksApiParams {
  apiClient: ZerionApiClient;
  source: NetworksSource;
}

function toNetworkConfigs(chains: ChainFullInfo[]) {
  return chains.map(chainFullInfoToNetworkConfig).filter(isTruthy);
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
}: NetworksApiParams): Promise<NetworkConfig[]> {
  try {
    const { data } = await apiClient.chainList(
      { supportedOnly: true, includeTestnets: source === 'testnet' },
      { source }
    );
    return toNetworkConfigs(data);
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
): Promise<NetworkConfig | null> {
  try {
    const { data } = await apiClient.chainGet(
      { eip155Id: Number(chainId) },
      { source }
    );
    return chainFullInfoToNetworkConfig(data);
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
): Promise<NetworkConfig | null> {
  const { data } = await apiClient.chainList(
    { searchQuery: id, supportedOnly: false, includeTestnets: true },
    { source }
  );
  const chain = data.find((item) => item.id === id);
  return chain ? chainFullInfoToNetworkConfig(chain) : null;
}

export async function getNetworksBySearch({
  query,
  includeTestnets,
  apiClient,
  source,
}: NetworksApiParams & {
  query: string;
  includeTestnets: boolean;
}): Promise<NetworkConfig[]> {
  const { data } = await apiClient.chainList(
    {
      searchQuery: query.trim().toLowerCase(),
      supportedOnly: false,
      includeTestnets,
    },
    { source }
  );
  return toNetworkConfigs(data);
}
