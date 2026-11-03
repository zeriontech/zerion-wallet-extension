import { createSwapQuotesV3Url } from './createSwapQuotesV3Url';

const EVM_ADDRESS = '0x42b9df65b219b3dd36ff330a4dd8f327a6ada990';
const SOLANA_RECEIVER = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';
const ETH = 'eth';
const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const SOL = '11111111111111111111111111111111';

function parse(url: string) {
  const { pathname, searchParams } = new URL(url);
  return {
    pathname,
    params: Object.fromEntries(
      [...searchParams.entries()].sort(([a], [b]) => a.localeCompare(b))
    ),
  };
}

describe('createSwapQuotesV3Url', () => {
  test('same-chain swap', () => {
    const url = createSwapQuotesV3Url({
      address: EVM_ADDRESS,
      currency: 'usd',
      formState: {
        inputChain: 'ethereum',
        outputChain: 'ethereum',
        inputFungibleId: ETH,
        outputFungibleId: USDC,
        inputAmount: '0.5',
        slippage: '0.5',
      },
    });
    expect(parse(url)).toEqual({
      pathname: '/transaction/stream-swap-quotes/v3',
      params: {
        currency: 'usd',
        from: EVM_ADDRESS,
        inputAmount: '0.5',
        inputChain: 'ethereum',
        inputFungibleId: ETH,
        outputChain: 'ethereum',
        outputFungibleId: USDC,
        slippage: '0.5',
      },
    });
  });

  test('cross-chain bridge in auto slippage mode omits slippage', () => {
    const url = createSwapQuotesV3Url({
      address: EVM_ADDRESS,
      currency: 'eur',
      formState: {
        inputChain: 'ethereum',
        outputChain: 'base',
        inputFungibleId: USDC,
        outputFungibleId: ETH,
        inputAmount: '100',
      },
    });
    expect(parse(url)).toEqual({
      pathname: '/transaction/stream-swap-quotes/v3',
      params: {
        currency: 'eur',
        from: EVM_ADDRESS,
        inputAmount: '100',
        inputChain: 'ethereum',
        inputFungibleId: USDC,
        outputChain: 'base',
        outputFungibleId: ETH,
      },
    });
  });

  test('cross-ecosystem bridge sends the receiver as `to`', () => {
    const url = createSwapQuotesV3Url({
      address: EVM_ADDRESS,
      currency: 'usd',
      formState: {
        inputChain: 'ethereum',
        outputChain: 'solana',
        to: SOLANA_RECEIVER,
        inputFungibleId: ETH,
        outputFungibleId: SOL,
        inputAmount: '1',
        slippage: '1',
      },
    });
    expect(parse(url)).toEqual({
      pathname: '/transaction/stream-swap-quotes/v3',
      params: {
        currency: 'usd',
        from: EVM_ADDRESS,
        inputAmount: '1',
        inputChain: 'ethereum',
        inputFungibleId: ETH,
        outputChain: 'solana',
        outputFungibleId: SOL,
        slippage: '1',
        to: SOLANA_RECEIVER,
      },
    });
  });

  test('never serializes local-only gas, nonce or sort fields', () => {
    const url = createSwapQuotesV3Url({
      address: EVM_ADDRESS,
      currency: 'usd',
      formState: {
        inputChain: 'ethereum',
        outputChain: 'ethereum',
        inputFungibleId: ETH,
        outputFungibleId: USDC,
        inputAmount: '0.5',
        networkFeeSpeed: 'fast',
        maxFee: '30',
        maxPriorityFee: '2',
        gasPrice: '20',
        gasLimit: '21000',
        nonce: '7',
        sort: '2',
      },
    });
    expect(Object.keys(parse(url).params).sort()).toEqual([
      'currency',
      'from',
      'inputAmount',
      'inputChain',
      'inputFungibleId',
      'outputChain',
      'outputFungibleId',
    ]);
  });
});
