import { describe, expect, test } from 'vitest';
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
