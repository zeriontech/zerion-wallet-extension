import type { Quote2 } from 'src/shared/types/Quote';
import { getFundingFeeSummary } from './fundingFees';

function quote(overrides: Partial<Quote2> = {}): Quote2 {
  return {
    contractMetadata: {
      id: 'provider',
      name: 'Test Bridge',
      iconUrl: '',
      explorer: null,
    },
    outputAmount: { currency: 'usdc', quantity: '998.5', value: 998.5, usdValue: 998.5 },
    outputAmountAfterFees: {
      currency: 'usdc',
      quantity: '998.5',
      value: 998.5,
      usdValue: 998.5,
    },
    minimumOutputAmount: { currency: 'usdc', quantity: '997', value: 997, usdValue: 997 },
    error: null,
    protocolFee: {
      basePercentage: 0,
      percentage: 0,
      fungible: null,
      amount: { currency: 'usdc', quantity: '0', value: 0, usdValue: 0 },
    },
    bridgeFee: {
      fungible: null,
      amount: { currency: 'usdc', quantity: '1.2', value: 1.2, usdValue: 1.2 },
    },
    rate: [],
    networkFee: {
      free: false,
      amount: { currency: 'usd', quantity: '0.8', value: 0.8, usdValue: 0.8 },
      fungible: null,
    },
    transactionApprove: null,
    transactionSwap: {
      evm: {
        type: '0x2',
        from: '0xfrom',
        to: '0xto',
        nonce: '0x1',
        chainId: '0x1',
        gas: '0x1',
        gasPrice: null,
        maxFee: '0x1',
        maxPriorityFee: '0x1',
        value: '0x0',
        data: '0x',
        customData: null,
      },
      solana: null,
    },
    intentSwap: null,
    intentApprove: null,
    quoteId: 'quote-1',
    autoSlippage: null,
    finalSlippage: null,
    ...overrides,
  };
}

describe('getFundingFeeSummary', () => {
  test('sums actual network, bridge and protocol fees', () => {
    expect(getFundingFeeSummary(quote())).toEqual({
      provider: 'Test Bridge',
      outputUsdc: 998.5,
      networkFeeUsd: 0.8,
      bridgeFeeUsd: 1.2,
      protocolFeeUsd: 0,
      totalFeeUsd: 2,
    });
  });

  test('missing fee fields stay null instead of becoming fake zeros', () => {
    const summary = getFundingFeeSummary(
      quote({
        networkFee: null,
        bridgeFee: null,
        protocolFee: {
          basePercentage: 0,
          percentage: 0,
          fungible: null,
          amount: { currency: 'usdc', quantity: '0.5', value: 0.5, usdValue: 0.5 },
        },
      }),
    );
    expect(summary.networkFeeUsd).toBeNull();
    expect(summary.bridgeFeeUsd).toBeNull();
    expect(summary.protocolFeeUsd).toBe(0.5);
    expect(summary.totalFeeUsd).toBe(0.5);
  });

  test('no quote yields no numbers', () => {
    expect(getFundingFeeSummary(null)).toEqual({
      provider: null,
      outputUsdc: null,
      networkFeeUsd: null,
      bridgeFeeUsd: null,
      protocolFeeUsd: null,
      totalFeeUsd: null,
    });
  });
});
