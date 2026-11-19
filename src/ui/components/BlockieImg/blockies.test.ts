import { createHash } from 'crypto';
import { renderIcon, type BlockiesOptions } from './blockies';

function renderHash(opts: BlockiesOptions) {
  const calls: unknown[] = [];
  const context = {
    fillStyle: '',
    fillRect(...args: number[]) {
      calls.push([context.fillStyle, ...args]);
    },
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => context,
  };
  renderIcon(opts, canvas as unknown as HTMLCanvasElement);
  return createHash('sha256')
    .update(JSON.stringify({ w: canvas.width, h: canvas.height, calls }))
    .digest('hex');
}

/**
 * Golden hashes captured from @download/blockies 1.0.3 before it was inlined.
 * Guards against accidental changes to the PRNG or color generation.
 */
describe('blockies', () => {
  test.each([
    [
      { seed: '0x1111111111111111111111111111111111111111', size: 8, scale: 4 },
      '8b93b384cdee37a8d8c0e66bf7a258ff3d4aad9b76602d462aa98fa40074b4e3',
    ],
    [
      {
        seed: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
        size: 8,
        scale: 12,
      },
      '9968bbd247471bf67dc990ddb7db30355545ed5014b4c597e40cbe032e7d2392',
    ],
    [
      {
        seed: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
        size: 8,
        scale: 6.25,
      },
      '7b71c366c38e11aea8e3010dc01147d668d8c57677cb9061e683096d22f8c744',
    ],
  ])('matches the previous renderer for %j', (opts, expected) => {
    expect(renderHash(opts)).toBe(expected);
  });
});
