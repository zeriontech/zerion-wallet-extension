import { normalizedContains } from 'normalized-contains';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { Networks } from 'src/modules/networks/Networks';

function contains(str1?: string, str2?: string) {
  if (str1 == null || str2 == null) {
    return false;
  }
  return normalizedContains(str1.toLowerCase(), str2.toLowerCase());
}

export function filterNetworksByQuery(query: string) {
  return (item: NetworkConfig) =>
    contains(item.id, query) ||
    (Networks.isEip155(item) && contains(Networks.getChainId(item), query)) ||
    contains(item.name, query) ||
    contains(item.native_asset?.name, query) ||
    contains(item.native_asset?.symbol, query) ||
    contains(item.rpc_url_public?.join(' '), query) ||
    contains(item.explorer_home_url || '', query);
}

/**
 * Filters and sorts networks by query with prioritized matching:
 * 1. Networks with names or IDs starting with the query (highest priority)
 * 2. Networks with the query anywhere in the name or ID (medium priority)
 * 3. Networks matching other fields via filterNetworksByQuery (lowest priority)
 */
export function filterAndSortNetworksByQuery(
  networks: NetworkConfig[],
  query: string
): NetworkConfig[] {
  if (!query) {
    return networks;
  }

  const normalizedQuery = query.toLowerCase();
  const startsWithMatches: NetworkConfig[] = [];
  const nameContainsMatches: NetworkConfig[] = [];
  const otherMatches: NetworkConfig[] = [];
  const processedIds = new Set<string>();

  for (const network of networks) {
    // Skip if already processed
    if (processedIds.has(network.id)) {
      continue;
    }

    const networkName = network.name.toLowerCase();
    const networkId = network.id.toLowerCase();

    // Priority 1: Name or ID starts with query
    if (networkName.startsWith(normalizedQuery) || networkId.startsWith(normalizedQuery)) {
      startsWithMatches.push(network);
      processedIds.add(network.id);
    }
    // Priority 2: Name or ID contains query (but doesn't start with it)
    else if (contains(network.name, query) || contains(network.id, query)) {
      nameContainsMatches.push(network);
      processedIds.add(network.id);
    }
    // Priority 3: Other fields match
    else if (filterNetworksByQuery(query)(network)) {
      otherMatches.push(network);
      processedIds.add(network.id);
    }
  }

  return [...startsWithMatches, ...nameContainsMatches, ...otherMatches];
}
