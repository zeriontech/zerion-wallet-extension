import { useQuery } from '@tanstack/react-query';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { toMultichainTransaction } from 'src/shared/types/Quote';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
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
  transactionSend: null | MultichainTransaction;
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
      const { transactionSend, ...rest } = response.data;
      return {
        ...rest,
        transactionSend: transactionSend
          ? toMultichainTransaction(transactionSend)
          : null,
      };
    },
    enabled,
    keepPreviousData,
    suspense,
    staleTime: STALE_TIME,
    retry: 1,
  });
}
