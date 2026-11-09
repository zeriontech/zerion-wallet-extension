import type { NetworkFeeType } from 'src/modules/zerion-api/types/NetworkFeeType';
import type { TransactionPrepareError } from 'src/modules/zerion-api/types/TransactionPrepareError';
import { getSendErrorCopy } from './TransactionWarning/resolveSendTransactionWarning';

export type SendSlotButton = 'top-up' | 'send-disabled' | null;

export interface SendSlot {
  details: boolean;
  banner: { title: string; description: string | null } | null;
  button: SendSlotButton;
}

const TOP_UP_HINT = 1;

export function resolveSendSlot(
  response: {
    error: TransactionPrepareError | null;
    networkFee: NetworkFeeType | null;
  } | null,
  context: { assetSymbol: string | null; nativeAssetSymbol: string | null },
): SendSlot {
  if (!response) {
    return { details: false, banner: null, button: null };
  }
  const { error, networkFee } = response;
  return {
    details: networkFee !== null,
    banner: error ? getSendErrorCopy(error, context) : null,
    button: error ? (error.hint === TOP_UP_HINT ? 'top-up' : 'send-disabled') : null,
  };
}
