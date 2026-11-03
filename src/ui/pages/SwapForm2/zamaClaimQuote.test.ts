import type { Quote2 } from 'src/shared/types/Quote';
import { isExecutableQuote } from 'src/shared/types/Quote';
import type { NetworkInfo } from 'src/modules/networks/NetworkInfo';
import type { QuotesData } from 'src/ui/shared/requests/useQuotes';
import { resolveTransactionWarning } from './TransactionWarning/resolveTransactionWarning';
import { selectDefaultQuote } from './selectSwapQuote';
import type { SwapFormState2 } from './types';

const contractMetadata = {
  id: 'zama',
  name: 'Zama',
  iconUrl: 'https://protocol-icons.s3.amazonaws.com/icons/zama.jpg',
  explorer: null,
};

// The unshield of 12.5 cUSDC whose claim was dismissed: the wrapper is already burned, so the form holds less than it asks to swap.
const formState: SwapFormState2 = {
  inputChain: 'ethereum',
  inputFungibleId: 'c8bb33a4-9f3c-48f6-bd76-97e3f4649670',
  outputChain: 'ethereum',
  outputFungibleId: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  inputAmount: '12.5',
};

const readyClaimQuote = {
  contractMetadata,
  outputAmount: {
    currency: 'usd',
    quantity: '12.5',
    value: 12.5,
    usdValue: 12.5,
  },
  error: null,
  rate: [],
  transactionApprove: null,
  transactionSwap: {
    evm: {
      type: '0x2',
      from: '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990',
      to: '0xe978f22157048e5db8e5d07971376e86671672b2',
      nonce: '0x1',
      chainId: '0x1',
      gas: '0x30d40',
      gasPrice: null,
      maxFee: '0x3b9aca00',
      maxPriorityFee: '0x5f5e100',
      value: '0x0',
      data: '0x5bf4ef06',
      customData: null,
    },
    solana: null,
  },
  quoteId: 'q1.claim',
  intentSwap: null,
  intentApprove: null,
  finalSlippage: null,
} as unknown as Quote2;

// TBG internal/dex/testdata/zama-claim-pending.json, as ZPI forwards it: no transaction, no quote id, the retry reason in `error`.
const pendingClaimQuote = {
  contractMetadata,
  outputAmount: { currency: 'usd', quantity: '0', value: null, usdValue: null },
  error: { message: 'The existing unshield proof is not ready; retry shortly' },
  rate: [],
  transactionApprove: null,
  transactionSwap: null,
  quoteId: '',
  intentSwap: null,
  intentApprove: null,
  finalSlippage: null,
} as unknown as Quote2;

const ethereum = {
  id: 'ethereum',
  name: 'Ethereum',
  flags: {
    supportsTrading: true,
    supportsBridging: true,
    supportsSimulations: true,
  },
} as unknown as NetworkInfo;

function quotesQuery(quotes: Quote2[]): QuotesData<Quote2> {
  return {
    done: true,
    isLoading: false,
    quotes,
    error: null,
  } as unknown as QuotesData<Quote2>;
}

describe('Zama claim quote returned for a dismissed claim', () => {
  test('a ready claim quote is executable and is the selected quote', () => {
    expect(isExecutableQuote(readyClaimQuote)).toBe(true);
    expect(selectDefaultQuote([readyClaimQuote])).toBe(readyClaimQuote);
  });

  test('a ready claim quote raises no warning and does not block signing', () => {
    expect(
      resolveTransactionWarning({
        quote: readyClaimQuote,
        quotesQuery: quotesQuery([readyClaimQuote]),
        formState,
        simulationResult: null,
        inputNetwork: ethereum,
        outputNetwork: ethereum,
      })
    ).toEqual({
      warning: null,
      unverified: false,
      blocksAutoSign: false,
      dangerTitle: null,
    });
  });

  test('a pending claim quote is not executable but stays selected so its error shows', () => {
    expect(isExecutableQuote(pendingClaimQuote)).toBe(false);
    expect(selectDefaultQuote([pendingClaimQuote])).toBe(pendingClaimQuote);
  });

  test("a pending claim quote shows the backend's retry reason", () => {
    expect(
      resolveTransactionWarning({
        quote: pendingClaimQuote,
        quotesQuery: quotesQuery([pendingClaimQuote]),
        formState,
        simulationResult: null,
        inputNetwork: ethereum,
        outputNetwork: ethereum,
      }).warning
    ).toEqual({
      variant: 'error',
      title: 'Transaction will fail',
      description: 'The existing unshield proof is not ready; retry shortly',
    });
  });
});
