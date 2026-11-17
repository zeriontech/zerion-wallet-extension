import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/types';

vi.mock('src/ui/features/preferences/usePreferences', () => ({
  getPreferences: async () => ({ testnetMode: { on: false } }),
}));
vi.mock('src/modules/zerion-api/zerion-api.client', () => ({
  ZerionAPI: {},
}));
vi.mock('src/modules/networks/networks-store.client', () => ({
  getNetworksStore: vi.fn(),
}));
vi.mock('src/modules/ethereum/transactions/fetchAndAssignGasPrice', () => ({
  estimateGasForNetwork: vi.fn(),
}));
vi.mock('src/modules/ethereum/transactions/gasPrices/requests', () => ({
  fetchGasPrice: vi.fn(),
}));
import { applyStaleGas, isStepStale } from './refreshStaleGas';
import type { SignStep } from './types';

const GAS_PRICES: ChainGasPrice = {
  average: {
    classic: null,
    eip1559: { maxFee: 20, priorityFee: 2, baseFee: 10 },
    optimistic: null,
    eta: 90,
    block: 100,
    source: 'fixed',
  },
  fast: {
    classic: null,
    eip1559: { maxFee: 50, priorityFee: 5, baseFee: 10 },
    optimistic: null,
    eta: 30,
    block: 101,
    source: 'p75',
  },
  formulaVersion: 'v2',
};

function makeStep(feeSpeed: 'average' | 'fast' | 'custom'): SignStep {
  return {
    kind: 'send',
    params: {
      transaction: {
        evm: {
          gas: '0x5208',
          maxFeePerGas: '0x1',
          maxPriorityFeePerGas: '0x1',
        },
      },
      chain: 'ethereum',
      feeValueCommon: null,
      feeSpeed,
      initiator: 'https://extension',
      clientScope: 'Send',
      addressAction: null,
    },
  } as SignStep;
}

describe('applyStaleGas', () => {
  test('keeps the selected average speed', () => {
    const result = applyStaleGas(makeStep('average'), {
      freshGas: null,
      freshPrice: GAS_PRICES,
      now: 123,
    });
    if (result.kind !== 'send') throw new Error('expected send step');
    const evm = result.params.transaction.evm;
    expect(Number(evm?.maxFeePerGas)).toBe(20);
    expect(Number(evm?.maxPriorityFeePerGas)).toBe(2);
    expect(result.params.feeBlock).toBe(100);
    expect(result.params.feeSource).toBe('fixed');
    expect(result.params.feeFormulaVersion).toBe('v2');
    expect(result.params.feeUpdatedAt).toBe(123);
  });

  test('leaves a custom fee untouched', () => {
    const step = makeStep('custom');
    const result = applyStaleGas(step, {
      freshGas: 50_000,
      freshPrice: GAS_PRICES,
    });
    expect(result).toBe(step);
  });

  test('raises the gas limit to a fresh higher estimate', () => {
    const result = applyStaleGas(makeStep('fast'), {
      freshGas: 30_000,
      freshPrice: null,
      now: 123,
    });
    if (result.kind !== 'send') throw new Error('expected send step');
    const evm = result.params.transaction.evm;
    expect(evm?.gasLimit).toBe(30_000);
    expect(evm?.gas).toBeUndefined();
  });

  test('does not lower a higher existing limit', () => {
    const step = makeStep('fast');
    if (step.kind !== 'send' || !step.params.transaction.evm) throw new Error();
    step.params.transaction.evm.gas = '0x186a0'; // 100000
    const result = applyStaleGas(step, {
      freshGas: 30_000,
      freshPrice: null,
    });
    expect(result).toBe(step);
  });
});

describe('isStepStale', () => {
  test('uses the fee snapshot timestamp when present', () => {
    const step = makeStep('fast');
    if (step.kind !== 'send') throw new Error();
    step.params.feeUpdatedAt = 1000;
    expect(isStepStale(step, 0, 10_500)).toBe(false);
    expect(isStepStale(step, 0, 12_000)).toBe(true);
  });

  test('falls back to the enqueue time', () => {
    const step = makeStep('fast');
    expect(isStepStale(step, 1000, 10_500)).toBe(false);
    expect(isStepStale(step, 1000, 12_000)).toBe(true);
  });
});
