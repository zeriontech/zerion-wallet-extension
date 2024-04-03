import { normalizeChainId } from './normalizeChainId';

test('normalizeChainId', () => {
  expect(normalizeChainId(137)).toBe('0x89');
  expect(normalizeChainId('137')).toBe('0x89');
  expect(normalizeChainId('0x89')).toBe('0x89');

  expect(normalizeChainId(1)).toBe('0x1');
  expect(normalizeChainId('1')).toBe('0x1');
  expect(normalizeChainId('0x1')).toBe('0x1');

  expect(normalizeChainId(42161)).toBe('0xa4b1');
  expect(normalizeChainId('42161')).toBe('0xa4b1');
  expect(normalizeChainId('0xa4b1')).toBe('0xa4b1');
});
