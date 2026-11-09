import type { TransactionGetSendResult } from 'src/modules/zerion-api/hooks/useTransactionGetSend';

export function selectCurrentSendResponse(
  data: TransactionGetSendResult | undefined,
  isPreviousData: boolean,
): TransactionGetSendResult | undefined {
  return isPreviousData ? undefined : data;
}
