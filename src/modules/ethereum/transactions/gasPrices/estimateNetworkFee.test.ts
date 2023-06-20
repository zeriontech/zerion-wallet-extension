import { estimateNetworkFee } from './estimateNetworkFee';
import { samples } from './estimateNetworkFee.samples';

describe('feeEstimation for optimism', () => {
  test('returns integer values', async () => {
    const result = await estimateNetworkFee(samples.optimistic.input1);
    expect(result).toEqual({
      type: 'optimistic',
      estimatedFee: 133820423939085,
      maxFee: 163244335957346,
    });
  });
});
