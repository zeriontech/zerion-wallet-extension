import { isExecutableQuote, type Quote2 } from 'src/shared/types/Quote';
import type { QuotesData } from 'src/ui/shared/requests/useQuotes';
import type { ButtonState } from 'src/ui/components/HoldToSignButton';
import type { SwapFormState2 } from '../types';
import { ADD_WALLET_PATH, isNoWalletQuote } from '../shared/isNoWalletQuote';

export function resolveLabel({
  formState,
  quote,
  quotesQuery,
  state,
  simulated,
  isCrossEcosystem,
  receiverEcosystemMismatch,
  isCrossChain,
}: {
  formState: SwapFormState2;
  quote: Quote2 | null;
  quotesQuery: QuotesData<Quote2>;
  state: ButtonState;
  simulated: boolean;
  isCrossEcosystem: boolean;
  receiverEcosystemMismatch: boolean;
  isCrossChain: boolean;
}): string {
  if (state === 'simulating') {
    return 'Verifying Transaction';
  }
  if (simulated) {
    return 'Confirm Swap';
  }
  if (!formState.outputFungibleId) {
    return 'Select Token';
  }
  if (!formState.inputAmount || Number(formState.inputAmount) === 0) {
    return 'Enter an Amount';
  }
  if (isCrossEcosystem && !formState.to) {
    return 'Enter Recipient Address';
  }
  if (isCrossEcosystem && receiverEcosystemMismatch) {
    return 'Unable to Swap';
  }
  if (isNoWalletQuote(quote)) {
    return 'Add wallet';
  }
  if (quote?.error || quotesQuery.error) {
    return 'Unable to Swap';
  }
  if (quotesQuery.isLoading && !quote) {
    return 'Getting quote';
  }
  if (formState.to) {
    return isCrossChain ? 'Bridge & Send Now' : 'Send Now';
  }
  return isCrossChain ? 'Bridge Now' : 'Swap Now';
}

export function isDisabled({
  quote,
  formState,
  state,
  simulated,
  signing,
  isCrossEcosystem,
  receiverEcosystemMismatch,
}: {
  quote: Quote2 | null;
  formState: SwapFormState2;
  state: ButtonState;
  simulated: boolean;
  signing: boolean;
  isCrossEcosystem: boolean;
  receiverEcosystemMismatch: boolean;
}) {
  if (signing) return true;
  if (state === 'simulating') return true;
  if (simulated) return false;
  if (!formState.outputFungibleId) return true;
  if (!formState.inputAmount || Number(formState.inputAmount) === 0) return true;
  if (isCrossEcosystem && !formState.to) return true;
  if (isCrossEcosystem && receiverEcosystemMismatch) return true;
  if (!quote) return true;
  if (isNoWalletQuote(quote)) return false;
  if (!isExecutableQuote(quote)) return true;
  return false;
}

export function resolveLinkTarget(quote: Quote2 | null): string | null {
  return isNoWalletQuote(quote) ? ADD_WALLET_PATH : null;
}
