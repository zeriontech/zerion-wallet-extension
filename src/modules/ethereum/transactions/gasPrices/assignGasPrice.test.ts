import { assignGasPrice } from './assignGasPrice';
import type { GasPriceObject } from './GasPriceObject';

type AssignedTx = {
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  gasPrice?: string;
};

const asTx = (tx: unknown) => tx as AssignedTx;

function eip1559(maxFee: number, priorityFee: number): GasPriceObject {
  return {
    eip1559: { maxFee, priorityFee },
    classic: null,
    optimistic: null,
  };
}

describe('assignGasPrice', () => {
  test('clamps the tip to the max fee', () => {
    const tx = asTx(assignGasPrice({}, eip1559(100, 150)));
    expect(Number(tx.maxFeePerGas)).toBe(100);
    expect(Number(tx.maxPriorityFeePerGas)).toBe(100);
  });

  test('keeps a valid tip unchanged', () => {
    const tx = asTx(assignGasPrice({}, eip1559(100, 10)));
    expect(Number(tx.maxFeePerGas)).toBe(100);
    expect(Number(tx.maxPriorityFeePerGas)).toBe(10);
  });

  test('uses the optimistic underlying values and clamps them', () => {
    const tx = asTx(
      assignGasPrice({}, {
        eip1559: null,
        classic: null,
        optimistic: {
          underlying: { eip1559: { maxFee: 10, priorityFee: 20 }, classic: null },
        },
      } as GasPriceObject),
    );
    expect(Number(tx.maxFeePerGas)).toBe(10);
    expect(Number(tx.maxPriorityFeePerGas)).toBe(10);
  });

  test('writes a classic gas price and clears 1559 fields', () => {
    const tx = asTx(
      assignGasPrice(
        { maxFeePerGas: '0x1', maxPriorityFeePerGas: '0x1' },
        { eip1559: null, classic: 42, optimistic: null },
      ),
    );
    expect(Number(tx.gasPrice)).toBe(42);
    expect(tx.maxFeePerGas).toBeUndefined();
    expect(tx.maxPriorityFeePerGas).toBeUndefined();
  });

  test('throws without a usable gas price object', () => {
    expect(() => assignGasPrice({}, { eip1559: null, classic: null, optimistic: null })).toThrow();
  });
});
