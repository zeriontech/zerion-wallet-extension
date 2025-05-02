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
