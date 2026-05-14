import { useQuery } from '@tanstack/react-query';
import { persistentQuery } from 'src/ui/shared/requests/queryClientPersistence';
import { ZerionAPI } from '../zerion-api.client';
import type { Params } from '../requests/wallet-get-nft-position';
import type { BackendSourceParams } from '../shared';

const QUERY_KEY = 'walletGetNftPosition';
const STALE_TIME = 20000;

export function useWalletNftPosition(
  params: Params,
  { source }: BackendSourceParams,
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: persistentQuery([QUERY_KEY, params, source]),
    queryFn: () => ZerionAPI.walletGetNftPosition(params, { source }),
    enabled,
    staleTime: STALE_TIME,
    suspense: false,
  });
}
