import ky from 'ky';
import { DEFI_SDK_TRANSACTIONS_API_URL } from 'src/env/config';
import type { Chain } from 'src/modules/networks/Chain';
import { invariant } from 'src/shared/invariant';

export async function getPopularTokens(chain: Chain) {
  const params = new URLSearchParams({ chain: chain.toString() });
  invariant(
    DEFI_SDK_TRANSACTIONS_API_URL,
    'DEFI_SDK_TRANSACTIONS_API_URL must be defined in ENV'
  );
  const result = await ky
    .get(
      new URL(
        `/swap/popularTokens?${params.toString()}`,
        DEFI_SDK_TRANSACTIONS_API_URL
      )
    )
    .json<{ assets: string[] }>();
  return result.assets;
}
