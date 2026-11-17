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
  test('swap price change scales the approve by one effective-price ratio', () => {
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

    // Approve mirrors the swap's effective-price ratio (200/100 = 2):
    //   maxFee:   300 * 2 = 600
    //   priority: 20  * 2 = 40
    expect(Number(result.transactionApprove?.evm?.maxFee)).toBe(600);
    expect(Number(result.transactionApprove?.evm?.maxPriorityFee)).toBe(40);
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

  test('approve maxFee follows the swap effective-price ratio', () => {
    // The approve's own maxFee magnitude is irrelevant — it scales by the swap's
    // effective price change (100 → 95), regardless of its headroom.
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

    expect(Number(result.transactionApprove?.evm?.maxFee)).toBe(950);
    expect(Number(result.transactionApprove?.evm?.maxPriorityFee)).toBe(19);
  });

  test('one ratio keeps the approve tip at or below its max fee', () => {
    const swapEvm = makeEvm({ maxFee: hex(1000), maxPriorityFee: hex(10) });
    const approveEvm = makeEvm({ maxFee: hex(200), maxPriorityFee: hex(10) });
    const quote = makeQuote({
      transactionSwap: { evm: swapEvm, solana: null },
      transactionApprove: { evm: approveEvm, solana: null },
    });
    // Old effective min(1000, 100) = 100; new effective min(100, 190) = 100.
    // The old per-field ratios (0.1 maxFee, 10 priority) would have produced
    // approve tip 100 > maxFee 20.
    const gasPrices = makeGasPrices({
      maxFee: 100,
      priorityFee: 100,
      baseFee: 90,
    });

    const result = applyTransactionConfiguration(quote, PRESET_FAST, gasPrices);
    const maxFee = Number(result.transactionApprove?.evm?.maxFee);
    const tip = Number(result.transactionApprove?.evm?.maxPriorityFee);
    expect(tip).toBeLessThanOrEqual(maxFee);
    expect(maxFee).toBe(200);
    expect(tip).toBe(10);
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
