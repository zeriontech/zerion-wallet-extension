import { estimateNetworkFee } from './estimateNetworkFee';
import { samples } from './estimateNetworkFee.samples';

describe('feeEstimation for optimism', () => {
  test('returns integer values', async () => {
    const result = await estimateNetworkFee(samples.optimistic.input1);
    expect(result).toEqual({
      type: 'optimistic',
      estimatedFee: 133739379951065,
      maxFee: 163163291969326,
    });
  });
});
