import type { TransactionPrepareError } from 'src/modules/zerion-api/types/TransactionPrepareError';
import type { IntentMultichain, Quote2, TransactionEVM } from './Quote';

export const SWAP_TX_EVM: TransactionEVM = {
  type: '0x2',
  from: '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990',
  to: '0xd7f1dd5d49206349cae8b585fcb0ce3d96f1696f',
  nonce: '0x1',
  chainId: '0x1',
  gas: '0x30d40',
  gasPrice: null,
  maxFee: '0x3b9aca00',
  maxPriorityFee: '0x5f5e100',
  value: '0x0',
  data: '0x12aa3caf',
  customData: null,
};

export const INTENT_EVM: IntentMultichain = {
  evm: {
    types: { Order: [{ name: 'sellToken', type: 'address' }] },
    primaryType: 'Order',
    domain: { name: 'Gnosis Protocol', version: 'v2', chainId: 1 },
    message: { sellToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
  },
  solana: null,
};

export const INTENT_SOLANA: IntentMultichain = {
  evm: null,
  solana: 'AQABAgMEBQYHCAkKCwwNDg8=',
};

export const QUOTE_ERROR: TransactionPrepareError = {
  code: 1,
  message: 'Not enough input asset balance',
  hint: 1,
};

export function makeQuote(id: string, overrides: Partial<Quote2>): Quote2 {
  return {
    contractMetadata: { id, name: id, iconUrl: '', explorer: null },
    error: null,
    transactionApprove: null,
    transactionSwap: null,
    quoteId: '',
    intentSwap: null,
    intentApprove: null,
    // The rest of Quote2 is irrelevant to the helpers under test.
    ...overrides,
  } as Quote2;
}

export const intentQuote = makeQuote('cowswap', {
  intentSwap: INTENT_EVM,
  quoteId: 'q-intent',
});
export const onChainQuote = makeQuote('1inch', {
  transactionSwap: { evm: SWAP_TX_EVM, solana: null },
  quoteId: 'q-onchain',
});
export const errorQuote = makeQuote('0x', {
  error: QUOTE_ERROR,
});
export const intentQuoteWithoutId = makeQuote('uniswapx', {
  intentSwap: INTENT_EVM,
  quoteId: '',
});
