import type { Quote2 } from 'src/shared/types/Quote';
import type { NetworkInfo } from 'src/modules/networks/NetworkInfo';
import { depositPathFor } from '../SendForm2/resolveSendTopUpTarget';
import { resolveSwapTopUp } from './resolveSwapTopUp';
import type { SwapFormState2 } from './types';

const formState: SwapFormState2 = {
  inputChain: 'arbitrum',
  inputFungibleId: 'usdc-fungible-id',
  outputChain: 'arbitrum',
  outputFungibleId: 'dai-fungible-id',
};

const arbitrum = {
  id: 'arbitrum',
  baseAsset: { id: 'eth-fungible-id', symbol: 'ETH' },
} as unknown as NetworkInfo;

const arbitrumWithoutBaseAsset = { id: 'arbitrum', baseAsset: null } as unknown as NetworkInfo;

function quoteWithError(code: number): Quote2 {
  return { error: { code, message: 'BACKEND-SENTINEL', hint: 1 } } as unknown as Quote2;
}

describe('resolveSwapTopUp', () => {
  it.each(['0', '25'])('code 1 tops up the input asset when the input amount is %s', (amount) => {
    const topUp = resolveSwapTopUp({
      quote: quoteWithError(1),
      formState: { ...formState, inputAmount: amount },
      inputSymbol: 'USDC',
      inputNetwork: arbitrum,
    });
    expect(topUp).toEqual({
      label: 'Top Up USDC',
      depositTarget: { outputFungibleId: 'usdc-fungible-id', outputChain: 'arbitrum' },
    });
    expect(depositPathFor(topUp?.depositTarget ?? null)).toBe(
      '/deposit/form?outputFungibleId=usdc-fungible-id&outputChain=arbitrum',
    );
  });

  it('code 1 without a known input symbol falls back to the generic label', () => {
    const topUp = resolveSwapTopUp({
      quote: quoteWithError(1),
      formState,
      inputSymbol: undefined,
      inputNetwork: arbitrum,
    });
    expect(topUp?.label).toBe('Top Up Your Wallet');
  });

  it('code 2 tops up the base asset of the input network', () => {
    const topUp = resolveSwapTopUp({
      quote: quoteWithError(2),
      formState,
      inputSymbol: 'USDC',
      inputNetwork: arbitrum,
    });
    expect(topUp).toEqual({
      label: 'Top Up ETH',
      depositTarget: { outputFungibleId: 'eth-fungible-id', outputChain: 'arbitrum' },
    });
    expect(depositPathFor(topUp?.depositTarget ?? null)).toBe(
      '/deposit/form?outputFungibleId=eth-fungible-id&outputChain=arbitrum',
    );
  });

  it('code 2 without a base asset falls back to the generic label and deposit page', () => {
    const topUp = resolveSwapTopUp({
      quote: quoteWithError(2),
      formState,
      inputSymbol: 'USDC',
      inputNetwork: arbitrumWithoutBaseAsset,
    });
    expect(topUp).toEqual({ label: 'Top Up Your Wallet', depositTarget: null });
    expect(depositPathFor(topUp?.depositTarget ?? null)).toBe('/deposit');
  });

  it.each([0, 3, 4, 99])('code %p shows no top-up', (code) => {
    expect(
      resolveSwapTopUp({
        quote: quoteWithError(code),
        formState,
        inputSymbol: 'USDC',
        inputNetwork: arbitrum,
      }),
    ).toBeNull();
  });

  it('a quote without an error shows no top-up', () => {
    expect(
      resolveSwapTopUp({
        quote: { error: null } as unknown as Quote2,
        formState,
        inputSymbol: 'USDC',
        inputNetwork: arbitrum,
      }),
    ).toBeNull();
  });
});
