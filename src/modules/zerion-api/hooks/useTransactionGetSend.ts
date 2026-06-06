import { useQuery } from '@tanstack/react-query';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import type { TransactionMultichainBackend } from 'src/shared/types/Quote';
import type { Amount } from '../types/Amount';
import type { NetworkFeeType } from '../types/NetworkFeeType';
import type { TransactionPrepareError } from '../types/TransactionPrepareError';
import type { BackendSourceParams } from '../shared';
import type { Params } from '../requests/transaction-get-send';

const QUERY_KEY = 'transactionGetSend';
const STALE_TIME = 20000;

export interface TransactionGetSendResult {
  inputAmount: Amount;
  error: null | TransactionPrepareError;
  networkFee: null | NetworkFeeType;
  /**
   * The raw backend send transaction (same `TransactionEVM` field names as
   * `Quote2.transactionSwap`). Kept unconverted so SendForm2 can feed it to the
   * shared, quote-shaped network-fee helpers; the client `IncomingTransaction`
   * conversion happens once, at sign time.
   */
  transactionSend: null | TransactionMultichainBackend;
}

export function useTransactionGetSend(
  params: Params,
  { source }: BackendSourceParams,
  {
    enabled = true,
    keepPreviousData = false,
    suspense,
  }: {
    enabled?: boolean;
    keepPreviousData?: boolean;
    suspense?: boolean;
  } = {}
) {
  return useQuery({
    queryKey: [QUERY_KEY, params, source],
    queryFn: async (): Promise<TransactionGetSendResult> => {
      const response = await ZerionAPI.transactionGetSend(params, { source });
      return response.data;
    },
    enabled,
    keepPreviousData,
    suspense,
    staleTime: STALE_TIME,
    retry: 1,
  });
}
