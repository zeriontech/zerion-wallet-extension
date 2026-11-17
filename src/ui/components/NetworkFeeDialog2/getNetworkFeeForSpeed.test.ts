import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/types';
import type { Quote2, TransactionEVM } from 'src/shared/types/Quote';
import {
  getCustomExpectedFeeRatio,
  getCustomFeeRatioFromDefaults,
  getCustomMaxFeeRatio,
  getExpectedGasForQuote,
  getNetworkFeeRatio,
  getNetworkFeeRatioForConfiguration,
  getPresetEffectiveGasPrice,
  getSwapOriginalEffectiveGasPrice,
  scaleNetworkFee,
} from './getNetworkFeeForSpeed';

function hex(n: number): string {
  return `0x${n.toString(16)}`;
}

function makeEvm(overrides: Partial<TransactionEVM>): TransactionEVM {
  return {
    type: '0x2',
    from: '0xfrom',
    to: '0xto',
    nonce: '0x0',
    chainId: '0x1',
    gas: hex(256),
    gasPrice: null,
    maxFee: null,
    maxPriorityFee: null,
    value: '0x0',
    data: '0x',
    customData: null,
    ...overrides,
  };
}

function makeQuote(
  swapEvm: TransactionEVM | null,
  networkFee: Partial<NonNullable<Quote2['networkFee']>> = {},
  transactionApprove: Quote2['transactionApprove'] = null,
): Quote2 {
  return {
    transactionSwap: swapEvm ? { evm: swapEvm, solana: null } : null,
    transactionApprove,
    networkFee: {
      free: false,
      amount: null,
      fungible: null,
      ...networkFee,
    },
  } as Quote2;
}

function makeGasPrices(eip1559: {
  maxFee: number;
  priorityFee: number;
  baseFee: number;
}): ChainGasPrice {
  const speed = { classic: null, eip1559, optimistic: null, eta: null };
  // Slow is half the priority of fast, for ratio assertions below.
  const averageSpeed = {
    classic: null,
    eip1559: { ...eip1559, priorityFee: eip1559.priorityFee / 2 },
    optimistic: null,
    eta: null,
  };
  return { fast: speed, average: averageSpeed } as unknown as ChainGasPrice;
}

function amount(quantity: string) {
  return { currency: 'usd', quantity, value: null, usdValue: null };
}

describe('getSwapOriginalEffectiveGasPrice', () => {
  test('returns the swap tx effective price', () => {
    // min(maxFee 200, baseFee 90 + priority 10) = 100
    const quote = makeQuote(makeEvm({ maxFee: hex(200), maxPriorityFee: hex(10) }));
    expect(getSwapOriginalEffectiveGasPrice(quote, 90)).toBe(100);
  });

  test('returns null when no swap tx', () => {
    expect(getSwapOriginalEffectiveGasPrice(makeQuote(null), 90)).toBe(null);
    expect(getSwapOriginalEffectiveGasPrice(null, 90)).toBe(null);
  });
});

describe('getPresetEffectiveGasPrice', () => {
  test('reads the preset eip1559 values', () => {
    const gasPrices = makeGasPrices({
      maxFee: 400,
      priorityFee: 110,
      baseFee: 90,
    });
    // fast: min(400, 90 + 110) = 200
    expect(getPresetEffectiveGasPrice('fast', gasPrices, 90)).toBe(200);
    // average: min(400, 90 + 55) = 145
    expect(getPresetEffectiveGasPrice('average', gasPrices, 90)).toBe(145);
  });

  test('null when no gasPrices', () => {
    expect(getPresetEffectiveGasPrice('fast', null, 90)).toBe(null);
  });
});

describe('getNetworkFeeRatio', () => {
  test('ratio of new effective to swap original', () => {
    // original 100, new 200 → 2
    const quote = makeQuote(makeEvm({ maxFee: hex(200), maxPriorityFee: hex(10) }));
    expect(getNetworkFeeRatio(quote, 200, 90)).toBe(2);
  });

  test('falls back to 1 when prices are missing', () => {
    const quote = makeQuote(makeEvm({ maxFee: hex(200), maxPriorityFee: hex(10) }));
    expect(getNetworkFeeRatio(quote, null, 90)).toBe(1);
    expect(getNetworkFeeRatio(makeQuote(null), 200, 90)).toBe(1);
  });
});

describe('getExpectedGasForQuote', () => {
  test('prefers gasUsed', () => {
    const quote = makeQuote(makeEvm({ maxFee: hex(200), maxPriorityFee: hex(10) }), {
      gasUsed: 21000,
    });
    expect(getExpectedGasForQuote(quote, 90, 18)).toBe(21000);
  });

  test('derives expected gas from the fee and the quote price', () => {
    // Fee quantity 21000 (decimals 0) at effective price 1 wei.
    const quote = makeQuote(makeEvm({ maxFee: hex(1), maxPriorityFee: hex(1) }), {
      amount: amount('21000') as never,
    });
    expect(getExpectedGasForQuote(quote, 0, 0)).toBe(21000);
  });

  test('returns null without enough data', () => {
    expect(getExpectedGasForQuote(makeQuote(null), 90, 18)).toBe(null);
  });
});

describe('getCustomExpectedFeeRatio', () => {
  test('scales only the effective price, not the gas limit', () => {
    const quote = makeQuote(makeEvm({ gas: hex(256), maxFee: hex(200), maxPriorityFee: hex(10) }));
    // original effective 100, new effective 200 → 2, regardless of the custom limit.
    expect(getCustomExpectedFeeRatio(quote, 200, 90)).toBe(2);
  });
});

describe('getCustomMaxFeeRatio', () => {
  test('uses expected gas for a single-tx quote', () => {
    const quote = makeQuote(makeEvm({ gas: hex(256), maxFee: hex(100), maxPriorityFee: hex(10) }), {
      gasUsed: 100,
    });
    // price ratio 2, limit ratio 200 / expected 100 = 2 → 4.
    expect(getCustomMaxFeeRatio(quote, 200, 200, 90, 18)).toBe(4);
  });

  test('falls back to the swap gas limit when the quote has an approval', () => {
    const quote = makeQuote(
      makeEvm({ gas: hex(256), maxFee: hex(100), maxPriorityFee: hex(10) }),
      { gasUsed: 400 },
      { evm: makeEvm({ gas: hex(128) }), solana: null },
    );
    // Summed gasUsed is unusable for the swap-only limit; 512 / 256 = 2, then ×2 price → 4.
    expect(getCustomMaxFeeRatio(quote, 200, 512, 90, 18)).toBe(4);
  });

  test('defaults the limit ratio to 1 when the limit is null', () => {
    const quote = makeQuote(makeEvm({ gas: hex(256), maxFee: hex(200), maxPriorityFee: hex(10) }));
    expect(getCustomMaxFeeRatio(quote, 200, null, 90, 18)).toBe(2);
  });
});

describe('getNetworkFeeRatioForConfiguration', () => {
  const gasPrices = makeGasPrices({
    maxFee: 400,
    priorityFee: 110,
    baseFee: 90,
  });

  test('scales a preset from its gas price', () => {
    const quote = makeQuote(makeEvm({ maxFee: hex(200), maxPriorityFee: hex(10) }));
    expect(
      getNetworkFeeRatioForConfiguration(
        quote,
        {
          speed: 'average',
          custom1559GasPrice: null,
          customClassicGasPrice: null,
          gasLimit: null,
        },
        gasPrices,
        90,
      ),
    ).toBe(1.45);
  });

  test('a custom configuration prices the expected fee by price only', () => {
    const quote = makeQuote(makeEvm({ gas: hex(256), maxFee: hex(200), maxPriorityFee: hex(10) }));
    expect(
      getNetworkFeeRatioForConfiguration(
        quote,
        {
          speed: 'custom',
          custom1559GasPrice: { maxFee: 200, priorityFee: 10 },
          customClassicGasPrice: null,
          gasLimit: '512',
        },
        gasPrices,
        90,
      ),
    ).toBe(1);
  });

  test('scales a classic gas-price configuration', () => {
    const quote = makeQuote(makeEvm({ gas: hex(256), gasPrice: hex(100) }));
    const classicGasPrices = {
      fast: { classic: 200, eip1559: null, optimistic: null, eta: null },
      average: { classic: 150, eip1559: null, optimistic: null, eta: null },
    };
    expect(
      getNetworkFeeRatioForConfiguration(
        quote,
        {
          speed: 'fast',
          custom1559GasPrice: null,
          customClassicGasPrice: null,
          gasLimit: null,
        },
        classicGasPrices,
        null,
      ),
    ).toBe(2);
  });
});

describe('getCustomFeeRatioFromDefaults', () => {
  test('prices the Custom row by price only (the quote defaults match the tx)', () => {
    const quote = makeQuote(
      makeEvm({
        gas: hex(256),
        maxFee: hex(200_000_000_000),
        maxPriorityFee: hex(10_000_000_000),
      }),
    );
    expect(
      getCustomFeeRatioFromDefaults(
        quote,
        {
          maxFee: '200',
          priorityFee: '10',
          baseFee: '90',
          gasLimit: '512',
        },
        true,
        90_000_000_000,
      ),
    ).toBe(1);
  });

  test('scales a classic Custom row from its base fee', () => {
    const quote = makeQuote(makeEvm({ gas: hex(256), gasPrice: hex(100_000_000_000) }));
    expect(
      getCustomFeeRatioFromDefaults(quote, { baseFee: '200', gasLimit: '256' }, false, null),
    ).toBe(2);
  });

  test('returns null when defaults cannot produce a price', () => {
    expect(getCustomFeeRatioFromDefaults(makeQuote(null), undefined, true, null)).toBe(null);
  });
});

describe('scaleNetworkFee', () => {
  const fee = {
    free: false,
    amount: { quantity: '1', value: 2, usdValue: 3 },
    fungible: null,
  };

  test('scales quantity, value and usdValue', () => {
    expect(scaleNetworkFee(fee, 0.5)).toEqual({
      ...fee,
      amount: { quantity: '0.5', value: 1, usdValue: 1.5 },
    });
  });

  test('leaves the fee untouched for null/1/free', () => {
    expect(scaleNetworkFee(fee, null)).toBe(fee);
    expect(scaleNetworkFee(fee, 1)).toBe(fee);
    expect(scaleNetworkFee({ ...fee, free: true }, 2)).toEqual({
      ...fee,
      free: true,
    });
  });

  test('keeps null fiat values null', () => {
    const nullFiat = {
      free: false,
      amount: { quantity: '1', value: null, usdValue: null },
      fungible: null,
    };
    expect(scaleNetworkFee(nullFiat, 2).amount).toEqual({
      quantity: '2',
      value: null,
      usdValue: null,
    });
  });
});
