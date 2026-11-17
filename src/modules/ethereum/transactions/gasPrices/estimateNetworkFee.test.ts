import { estimateNetworkFee } from './estimateNetworkFee';
import { samples } from './estimateNetworkFee.samples';

describe('feeEstimation for optimism', () => {
  test('returns integer values', async () => {
    const result = await estimateNetworkFee(samples.optimistic.input1);
    expect(result).toEqual({
      type: 'optimistic',
      estimatedFee: 33077529225575,
      maxFee: 65204474524549,
    });
  });
});

describe('feeEstimation expected gas', () => {
  const transaction = {
    chainId: '0x1',
    from: '0xfrom',
    to: '0xto',
    value: '0x0',
    data: '0x',
  } as const;
  const eip1559GasPrices = {
    fast: {
      classic: null,
      eip1559: { maxFee: 20, priorityFee: 2, baseFee: 10 },
      optimistic: null,
      eta: 30,
    },
    average: {
      classic: null,
      eip1559: { maxFee: 20, priorityFee: 1, baseFee: 10 },
      optimistic: null,
      eta: 90,
    },
  };
  const eip1559GasPrice = {
    classic: null,
    optimistic: null,
    eip1559: { maxFee: 20, priorityFee: 2 },
  };
  const getNonce = async () => 0;

  test('prices the expected fee on expected gas, the reserve on the limit', async () => {
    const result = await estimateNetworkFee({
      address: '0xfrom',
      gas: 110,
      expectedGas: 100,
      gasPrices: eip1559GasPrices,
      gasPrice: eip1559GasPrice,
      transaction,
      getNonce,
    });
    // effective price min(20, 10 + 2) = 12
    expect(result?.type).toBe('eip1559');
    expect(Number(result?.estimatedFee)).toBe(100 * 12);
    expect(result?.maxFee).toBe(110 * 20);
  });

  test('falls back to the gas limit when expected gas is absent', async () => {
    const result = await estimateNetworkFee({
      address: '0xfrom',
      gas: 110,
      gasPrices: eip1559GasPrices,
      gasPrice: eip1559GasPrice,
      transaction,
      getNonce,
    });
    expect(result?.type).toBe('eip1559');
    expect(Number(result?.estimatedFee)).toBe(110 * 12);
    expect(result?.maxFee).toBe(110 * 20);
  });

  test('adds a classic reserve on the limit', async () => {
    const result = await estimateNetworkFee({
      address: '0xfrom',
      gas: 110,
      expectedGas: 100,
      gasPrices: null,
      gasPrice: { classic: 5, eip1559: null, optimistic: null },
      transaction,
      getNonce,
    });
    expect(result?.type).toBe('classic');
    expect(Number(result?.estimatedFee)).toBe(100 * 5);
    expect(result?.maxFee).toBe(110 * 5);
  });
});
