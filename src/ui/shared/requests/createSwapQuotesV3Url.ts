import { ZERION_API_URL } from 'src/env/config';
import { createUrl } from 'src/shared/createUrl';
import type { SwapFormState } from 'src/shared/types/SwapFormState';

export function createSwapQuotesV3Url({
  address,
  currency,
  formState,
}: {
  address: string;
  currency: string;
  formState: SwapFormState;
}) {
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
  return createUrl({
    base: ZERION_API_URL,
    pathname: '/transaction/stream-swap-quotes/v3',
    searchParams,
  }).toString();
}
