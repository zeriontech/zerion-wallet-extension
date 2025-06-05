import ky from 'ky';
import { DEFI_SDK_TRANSACTIONS_API_URL } from 'src/env/config';
import type { Chain } from 'src/modules/networks/Chain';
import { createUrl } from 'src/shared/createUrl';

export async function getPopularTokens(chain: Chain) {
  const url = createUrl({
    base: DEFI_SDK_TRANSACTIONS_API_URL,
    pathname: '/swap/popularTokens',
    searchParams: new URLSearchParams({ chain: chain.toString() }),
  }).toString();
  const result = await ky.get(url).json<{ assets: string[] }>();
  return result.assets;
}
