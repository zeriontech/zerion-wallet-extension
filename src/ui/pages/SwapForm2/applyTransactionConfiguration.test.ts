import type { CustomConfiguration } from 'src/shared/types/TransactionConfiguration';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/types';
import type { Quote2, TransactionEVM } from 'src/shared/types/Quote';
import { applyTransactionConfiguration } from './applyTransactionConfiguration';

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

function makeQuote(overrides: Partial<Quote2>): Quote2 {
  return {
    transactionSwap: null,
    transactionApprove: null,
    networkFee: { free: false, amount: null, fungible: null },
    // The rest of Quote2 is irrelevant to the helper.
    ...overrides,
  } as Quote2;
}

function makeGasPrices(eip1559: {
  maxFee: number;
  priorityFee: number;
  baseFee: number;
}): ChainGasPrice {
  const speed = {
    classic: null,
    eip1559,
    optimistic: null,
    eta: null,
  };
  return { fast: speed, average: speed };
}

const PRESET_FAST: CustomConfiguration = {
  nonce: null,
  slippage: null,
  networkFee: {
    speed: 'fast',
    custom1559GasPrice: null,
    customClassicGasPrice: null,
    gasLimit: null,
  },
};

describe('applyTransactionConfiguration', () => {
  test('swap price change gives a same-shape approve the swap fees', () => {
    const swapEvm = makeEvm({
      gas: hex(256),
      maxFee: hex(200),
      maxPriorityFee: hex(10),
    });
    // Approve has its own backend-sized values.
    const approveEvm = makeEvm({
      gas: hex(128),
      maxFee: hex(300),
      maxPriorityFee: hex(20),
    });
    const quote = makeQuote({
      transactionSwap: { evm: swapEvm, solana: null },
      transactionApprove: { evm: approveEvm, solana: null },
    });

    // New (fast): maxFee 200 → 400 (ratio 2), priority 10 → 110 (ratio 11).
    const gasPrices = makeGasPrices({
      maxFee: 400,
      priorityFee: 110,
      baseFee: 90,
    });

    const result = applyTransactionConfiguration(quote, PRESET_FAST, gasPrices);

    // Swap tx gets the configured price directly.
    expect(Number(result.transactionSwap?.evm?.maxFee)).toBe(400);
    expect(Number(result.transactionSwap?.evm?.maxPriorityFee)).toBe(110);
    // No custom gas limit → swap gas unchanged.
    expect(Number(result.transactionSwap?.evm?.gas)).toBe(256);

    // Approve copies the swap's configured fees.
    expect(Number(result.transactionApprove?.evm?.maxFee)).toBe(400);
    expect(Number(result.transactionApprove?.evm?.maxPriorityFee)).toBe(110);
    // gasLimitRatio === 1 (no custom limit) → approve gas unchanged.
    expect(Number(result.transactionApprove?.evm?.gas)).toBe(128);

    // networkFee untouched.
    expect(result.networkFee).toEqual(quote.networkFee);
  });

  test('legacy approve follows the swap effective-price ratio', () => {
    const swapEvm = makeEvm({ maxFee: hex(200), maxPriorityFee: hex(10) });
    const approveEvm = makeEvm({
      type: '0x0',
      maxFee: null,
      maxPriorityFee: null,
      gasPrice: hex(50),
    });
    const quote = makeQuote({
      transactionSwap: { evm: swapEvm, solana: null },
      transactionApprove: { evm: approveEvm, solana: null },
    });
    const gasPrices = makeGasPrices({
      maxFee: 400,
      priorityFee: 110,
      baseFee: 90,
    });

    const result = applyTransactionConfiguration(quote, PRESET_FAST, gasPrices);
    // Swap effective price 100 → 200 (ratio 2); approve follows it.
    expect(Number(result.transactionApprove?.evm?.gasPrice)).toBe(100);
  });

  test('approve maxFee is the swap maxFee regardless of its own headroom', () => {
    const swapEvm = makeEvm({ maxFee: hex(200), maxPriorityFee: hex(10) });
    const approveEvm = makeEvm({
      gas: hex(128),
      maxFee: hex(1000),
      maxPriorityFee: hex(20),
    });
    const quote = makeQuote({
      transactionSwap: { evm: swapEvm, solana: null },
      transactionApprove: { evm: approveEvm, solana: null },
    });
    // Swap effective price: min(200, 90 + 10) = 100 → min(100, 90 + 5) = 95.
    const gasPrices = makeGasPrices({
      maxFee: 100,
      priorityFee: 5,
      baseFee: 90,
    });

    const result = applyTransactionConfiguration(quote, PRESET_FAST, gasPrices);

    expect(Number(result.transactionApprove?.evm?.maxFee)).toBe(100);
    expect(Number(result.transactionApprove?.evm?.maxPriorityFee)).toBe(5);
  });

  test('the approve tip stays at or below its max fee', () => {
    const swapEvm = makeEvm({ maxFee: hex(1000), maxPriorityFee: hex(10) });
    const approveEvm = makeEvm({ maxFee: hex(200), maxPriorityFee: hex(10) });
    const quote = makeQuote({
      transactionSwap: { evm: swapEvm, solana: null },
      transactionApprove: { evm: approveEvm, solana: null },
    });
    // Per-field ratios (0.1 maxFee, 10 priority) would have produced approve
    // tip 100 > maxFee 20.
    const gasPrices = makeGasPrices({
      maxFee: 100,
      priorityFee: 100,
      baseFee: 90,
    });

    const result = applyTransactionConfiguration(quote, PRESET_FAST, gasPrices);
    const maxFee = Number(result.transactionApprove?.evm?.maxFee);
    const tip = Number(result.transactionApprove?.evm?.maxPriorityFee);
    expect(tip).toBeLessThanOrEqual(maxFee);
    expect(maxFee).toBe(100);
    expect(tip).toBe(100);
  });

  test('custom gas limit scales the approve gas (gasLimitRatio)', () => {
    const swapEvm = makeEvm({
      gas: hex(100),
      maxFee: hex(200),
      maxPriorityFee: hex(10),
    });
    const approveEvm = makeEvm({
      gas: hex(80),
      maxFee: hex(300),
      maxPriorityFee: hex(20),
    });
    const quote = makeQuote({
      transactionSwap: { evm: swapEvm, solana: null },
      transactionApprove: { evm: approveEvm, solana: null },
    });
    const gasPrices = makeGasPrices({
      maxFee: 400,
      priorityFee: 110,
      baseFee: 90,
    });
    const customConfig: CustomConfiguration = {
      nonce: null,
      slippage: null,
      networkFee: {
        speed: 'custom',
        custom1559GasPrice: { maxFee: 200, priorityFee: 10 },
        customClassicGasPrice: null,
        gasLimit: '200', // 2x the swap's original gas (100)
      },
    };

    const result = applyTransactionConfiguration(quote, customConfig, gasPrices);
    // Swap gas set to the custom limit.
    expect(Number(result.transactionSwap?.evm?.gas)).toBe(200);
    // Approve gas scaled by gasLimitRatio (200/100 = 2): 80 → 160.
    expect(Number(result.transactionApprove?.evm?.gas)).toBe(160);
  });

  test('identical swap and approve gas stay identical when the config re-resolves to the same price (ratio 1)', () => {
    // Both txs carry the exact same gas params, and the custom config resolves
    // to those same params → every per-field ratio is 1 and nothing should move.
    const gasParams = {
      gas: hex(150),
      maxFee: hex(200),
      maxPriorityFee: hex(10),
    };
    const swapEvm = makeEvm(gasParams);
    const approveEvm = makeEvm(gasParams);
    const quote = makeQuote({
      transactionSwap: { evm: swapEvm, solana: null },
      transactionApprove: { evm: approveEvm, solana: null },
    });
    const gasPrices = makeGasPrices({
      maxFee: 400,
      priorityFee: 110,
      baseFee: 90,
    });
    const sameConfig: CustomConfiguration = {
      nonce: null,
      slippage: null,
      networkFee: {
        speed: 'custom',
        custom1559GasPrice: { maxFee: 200, priorityFee: 10 },
        customClassicGasPrice: null,
        gasLimit: null,
      },
    };

    const result = applyTransactionConfiguration(quote, sameConfig, gasPrices);

    // Swap unchanged.
    expect(Number(result.transactionSwap?.evm?.maxFee)).toBe(200);
    expect(Number(result.transactionSwap?.evm?.maxPriorityFee)).toBe(10);
    expect(Number(result.transactionSwap?.evm?.gas)).toBe(150);
    // Approve unchanged — same numbers in, same numbers out.
    expect(Number(result.transactionApprove?.evm?.maxFee)).toBe(200);
    expect(Number(result.transactionApprove?.evm?.maxPriorityFee)).toBe(10);
    expect(Number(result.transactionApprove?.evm?.gas)).toBe(150);
  });

  test('pass-through when gasPrices is null', () => {
    const quote = makeQuote({
      transactionSwap: { evm: makeEvm({ maxFee: hex(200) }), solana: null },
    });
    expect(applyTransactionConfiguration(quote, PRESET_FAST, null)).toBe(quote);
  });

  test('pass-through for Solana swap tx (no evm)', () => {
    const quote = makeQuote({
      transactionSwap: { evm: null, solana: 'base64tx' },
    });
    const gasPrices = makeGasPrices({
      maxFee: 400,
      priorityFee: 110,
      baseFee: 90,
    });
    expect(applyTransactionConfiguration(quote, PRESET_FAST, gasPrices)).toBe(quote);
  });
});

describe('same-shape approve fees equal the swap fees', () => {
  test('production reproduction: approve does not drift 1 wei below the swap', () => {
    const quoted = { maxFee: '0x8f0d1803', maxPriorityFee: '0x2faf0801' };
    const quote = makeQuote({
      transactionSwap: { evm: makeEvm({ gas: hex(300000), ...quoted }), solana: null },
      transactionApprove: { evm: makeEvm({ gas: hex(60000), ...quoted }), solana: null },
    });
    const gasPrices = makeGasPrices({
      maxFee: 2496980274,
      priorityFee: 832326758,
      baseFee: 1664653516,
    });

    const result = applyTransactionConfiguration(quote, PRESET_FAST, gasPrices);

    for (const evm of [result.transactionSwap?.evm, result.transactionApprove?.evm]) {
      expect(evm?.maxFee).toBe('0x94d4e532');
      expect(evm?.maxPriorityFee).toBe('0x319c4c66');
      expect(evm?.gasPrice).toBeNull();
    }
  });

  function mulberry32(seed: number) {
    let a = seed;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  type Kind = 'fast' | 'average' | 'custom1559' | 'customClassic';
  const KINDS: Kind[] = ['fast', 'average', 'custom1559', 'customClassic'];

  test('holds for 1200 seeded random cases across preset and custom configurations', () => {
    const random = mulberry32(3972);
    const int = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
    const fees = () => {
      const maxFee = int(1, 5e11);
      return { maxFee, priorityFee: int(0, maxFee) };
    };

    for (let i = 0; i < 1200; i++) {
      const kind = KINDS[i % KINDS.length];
      const baseFee = int(1, 4e11);
      const configured = fees();
      const classicShape = kind === 'customClassic' || (kind !== 'custom1559' && random() < 0.5);
      const speed = {
        classic: classicShape ? int(1, 5e11) : null,
        eip1559: classicShape ? null : { ...configured, baseFee },
        optimistic: null,
        eta: null,
      };
      const gasPrices: ChainGasPrice = { fast: speed, average: speed };

      const quotedLeg = (gas: number) => {
        if (classicShape) {
          return makeEvm({ type: '0x0', gas: hex(gas), gasPrice: hex(int(1, 5e11)) });
        }
        const quoted = fees();
        return makeEvm({
          gas: hex(gas),
          maxFee: hex(quoted.maxFee),
          maxPriorityFee: hex(quoted.priorityFee),
        });
      };
      const quote = makeQuote({
        transactionSwap: { evm: quotedLeg(int(21000, 2e6)), solana: null },
        transactionApprove: { evm: quotedLeg(int(21000, 2e5)), solana: null },
      });

      const config: CustomConfiguration = {
        nonce: null,
        slippage: null,
        networkFee: {
          speed: kind === 'fast' || kind === 'average' ? kind : 'custom',
          custom1559GasPrice:
            kind === 'custom1559'
              ? { maxFee: configured.maxFee, priorityFee: configured.priorityFee }
              : null,
          customClassicGasPrice: kind === 'customClassic' ? int(1, 5e11) : null,
          gasLimit: null,
        },
      };

      const result = applyTransactionConfiguration(quote, config, gasPrices);
      const swap = result.transactionSwap?.evm;
      const approve = result.transactionApprove?.evm;
      const label = `case ${i} (${kind})`;
      expect(swap, label).not.toBe(quote.transactionSwap?.evm);
      expect(approve?.maxFee, label).toBe(swap?.maxFee);
      expect(approve?.maxPriorityFee, label).toBe(swap?.maxPriorityFee);
      expect(approve?.gasPrice, label).toBe(swap?.gasPrice);
    }
  });
});
