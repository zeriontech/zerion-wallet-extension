import type { TransactionPrepareError } from 'src/modules/zerion-api/types/TransactionPrepareError';
import type { SendFormState2 } from './types';

export interface DepositTarget {
  outputFungibleId: string;
  outputChain: string;
}

const TOP_UP_HINT = 1;
const INSUFFICIENT_INPUT_BALANCE = 1;
const INSUFFICIENT_BASE_ASSET = 2;

export function resolveSendTopUpTarget({
  error,
  formState,
  baseAssetId,
}: {
  error: TransactionPrepareError | null;
  formState: Pick<SendFormState2, 'inputChain' | 'inputFungibleId' | 'nftId'>;
  baseAssetId: string | null;
}): DepositTarget | null {
  if (!error || error.hint !== TOP_UP_HINT || !formState.inputChain) {
    return null;
  }
  if (error.code === INSUFFICIENT_BASE_ASSET && baseAssetId) {
    return { outputFungibleId: baseAssetId, outputChain: formState.inputChain };
  }
  if (error.code === INSUFFICIENT_INPUT_BALANCE && !formState.nftId && formState.inputFungibleId) {
    return {
      outputFungibleId: formState.inputFungibleId,
      outputChain: formState.inputChain,
    };
  }
  return null;
}

export function depositPathFor(target: DepositTarget | null): string {
  if (!target) {
    return '/deposit';
  }
  const params = new URLSearchParams({
    outputFungibleId: target.outputFungibleId,
    outputChain: target.outputChain,
  });
  return `/deposit/form?${params}`;
}
