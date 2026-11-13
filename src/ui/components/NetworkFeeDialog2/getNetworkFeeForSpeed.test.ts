import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/types';
import type { Quote2, TransactionEVM } from 'src/shared/types/Quote';
import {
  getCustomFeeRatio,
  getCustomFeeRatioFromDefaults,
  getNetworkFeeRatio,
  getNetworkFeeRatioForConfiguration,
  getPresetEffectiveGasPrice,
  getSwapOriginalEffectiveGasPrice,
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

function makeQuote(swapEvm: TransactionEVM | null): Quote2 {
  return {
    transactionSwap: swapEvm ? { evm: swapEvm, solana: null } : null,
    transactionApprove: null,
    networkFee: { free: false, amount: null, fungible: null },
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

describe('getCustomFeeRatio', () => {
  test('combines price ratio and gas-limit ratio', () => {
    // original effective 100, gas 256.
    const quote = makeQuote(makeEvm({ gas: hex(256), maxFee: hex(200), maxPriorityFee: hex(10) }));
    // new effective 200 (2x), gas limit 512 (2x) → 4x total
    expect(getCustomFeeRatio(quote, 200, 512, 90)).toBe(4);
  });

  test('gas-limit ratio defaults to 1 when gasLimit is null', () => {
    const quote = makeQuote(makeEvm({ gas: hex(256), maxFee: hex(200), maxPriorityFee: hex(10) }));
    expect(getCustomFeeRatio(quote, 200, null, 90)).toBe(2);
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

  test('includes the custom gas limit in a custom configuration', () => {
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
    ).toBe(2);
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
  test('prices the Custom row from quote-derived defaults', () => {
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
    ).toBe(2);
  });

  test('prices a classic Custom row from its base fee', () => {
    const quote = makeQuote(makeEvm({ gas: hex(256), gasPrice: hex(100_000_000_000) }));
    expect(
      getCustomFeeRatioFromDefaults(quote, { baseFee: '200', gasLimit: '256' }, false, null),
    ).toBe(2);
  });

  test('returns null when defaults cannot produce a price', () => {
    expect(getCustomFeeRatioFromDefaults(makeQuote(null), undefined, true, null)).toBe(null);
  });
});
