import { createChain } from 'src/modules/networks/Chain';
import { getSlippageOptions } from 'src/ui/shared/forms/trading/getSlippageOptions';
import type { SwapFormState } from 'src/shared/types/SwapFormState';

export const SWAP_QUOTES_V3_PATHNAME = '/transaction/stream-swap-quotes/v3';

export const QUOTES_EVENT_CODE_TO_MESSAGE = {
  500: 'Internal Server Error',
  503: 'Service Unavailable',
  404: 'No liquidity for this trade',
  400: 'Incorrect trade parameters',
};

/**
 * The exact form state serialized into the v3 stream request: user slippage is
 * normalized through getSlippageOptions, 'auto'/missing slippage is omitted so
 * the backend picks one. Shared by useQuotesV2 and the standalone Re-quote so
 * both requests are byte-for-byte identical.
 */
export function resolveQuotesFormState(
  formState: SwapFormState
): SwapFormState | null {
  const chain = formState.inputChain ? createChain(formState.inputChain) : null;
  if (!chain) {
    return null;
  }
  const slippage =
    formState.slippage === 'auto' || formState.slippage == null
      ? null
      : String(
          getSlippageOptions({
            chain,
            userSlippage: Number(formState.slippage),
          }).slippagePercent
        );
  return { ...formState, slippage: slippage ?? undefined };
}

/**
 * Search params of the v3 stream request. Kept free of env/React imports so the
 * Re-quote can be unit-tested; `createSwapQuotesV3Url` adds the API base.
 */
export function createSwapQuotesSearchParams({
  address,
  currency,
  formState,
}: {
  address: string;
  currency: string;
  formState: SwapFormState;
}): URLSearchParams {
  const searchParams = new URLSearchParams();
  searchParams.set('currency', currency);
  if (formState.inputChain) {
    searchParams.set('inputChain', formState.inputChain);
  }
  if (formState.outputChain) {
    searchParams.set('outputChain', formState.outputChain);
  }
  searchParams.set('from', address);
  if (formState.to) {
    searchParams.set('to', formState.to);
  }
  if (formState.inputFungibleId) {
    searchParams.set('inputFungibleId', formState.inputFungibleId);
  }
  if (formState.outputFungibleId) {
    searchParams.set('outputFungibleId', formState.outputFungibleId);
  }
  if (formState.inputAmount) {
    searchParams.set('inputAmount', formState.inputAmount);
  }
  if (formState.slippage) {
    searchParams.set('slippage', formState.slippage);
  }
  return searchParams;
}
