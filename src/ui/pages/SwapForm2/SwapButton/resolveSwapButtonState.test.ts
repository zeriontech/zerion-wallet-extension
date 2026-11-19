import type { Quote2 } from 'src/shared/types/Quote';
import type { QuotesData } from 'src/ui/shared/requests/useQuotes';
import type { SwapFormState2 } from '../types';
import { isDisabled, resolveLabel, resolveLinkTarget } from './resolveSwapButtonState';

const formState: SwapFormState2 = {
  inputChain: 'ethereum',
  inputFungibleId: 'eth',
  outputChain: 'ethereum',
  outputFungibleId: 'usdc',
  inputAmount: '1',
};

const quotesQuery = {
  done: true,
  isLoading: false,
  quotes: [],
  error: null,
} as unknown as QuotesData<Quote2>;

function makeQuote(error: { code: number; message: string; hint: number | null }): Quote2 {
  return {
    outputAmount: { currency: 'usd', quantity: '100', value: null, usdValue: null },
    transactionSwap: null,
    error,
  } as unknown as Quote2;
}

function resolveButton(quote: Quote2) {
  const common = {
    formState,
    quote,
    state: 'idle' as const,
    simulated: false,
    isCrossEcosystem: false,
    receiverEcosystemMismatch: false,
  };
  return {
    label: resolveLabel({ ...common, quotesQuery, isCrossChain: false }),
    disabled: isDisabled({ ...common, signing: false }),
    linkTarget: resolveLinkTarget(quote),
  };
}

describe('SwapButton label and disabled state', () => {
  it('code 3 (no wallet) → enabled "Add wallet" linking to /get-started', () => {
    const quote = makeQuote({
      code: 3,
      message: 'No wallet was provided for this trade',
      hint: 2,
    });
    expect(resolveButton(quote)).toEqual({
      label: 'Add wallet',
      disabled: false,
      linkTarget: '/get-started',
    });
  });

  it('code 1 (insufficient balance) → disabled "Unable to Swap" with no link', () => {
    const quote = makeQuote({ code: 1, message: 'Need more ETH', hint: 1 });
    expect(resolveButton(quote)).toEqual({
      label: 'Unable to Swap',
      disabled: true,
      linkTarget: null,
    });
  });

  it('code 4 (geo-blocked) → disabled "Unable to Swap" with no link', () => {
    const quote = makeQuote({
      code: 4,
      message: 'Trading is not allowed in your country',
      hint: 0,
    });
    expect(resolveButton(quote)).toEqual({
      label: 'Unable to Swap',
      disabled: true,
      linkTarget: null,
    });
  });

  it('an executable quote without an error → enabled "Swap Now"', () => {
    const quote = {
      outputAmount: { currency: 'usd', quantity: '100', value: null, usdValue: null },
      transactionSwap: { id: 'transaction' },
      error: null,
    } as unknown as Quote2;
    expect(resolveButton(quote)).toEqual({
      label: 'Swap Now',
      disabled: false,
      linkTarget: null,
    });
  });
});
