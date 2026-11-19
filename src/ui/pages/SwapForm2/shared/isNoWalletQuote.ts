import type { Quote2 } from 'src/shared/types/Quote';

const ERROR_CODE_NO_WALLET = 3;

export const ADD_WALLET_PATH = '/get-started';

export function isNoWalletQuote(quote: Quote2 | null): boolean {
  return quote?.error?.code === ERROR_CODE_NO_WALLET;
}
