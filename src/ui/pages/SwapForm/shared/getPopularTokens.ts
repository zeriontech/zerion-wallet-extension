import ky from 'ky';
import { DEFI_SDK_TRANSACTIONS_API_URL } from 'src/env/config';
import type { Chain } from 'src/modules/networks/Chain';

export async function getPopularTokens(chain: Chain) {
  const url = new URL('/swap/popularTokens', DEFI_SDK_TRANSACTIONS_API_URL);
  url.searchParams.append('chain', chain.toString());
  const result = await ky.get(url).json<{ assets: string[] }>();
  return result.assets;
}
