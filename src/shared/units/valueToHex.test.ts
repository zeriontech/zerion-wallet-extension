import { valueToHex } from './valueToHex';

describe('valueToHex', () => {
  test.each([
    { label: 'hex passthrough', input: '0x06a11e3d', expected: '0x06a11e3d' },
    { label: 'decimal string', input: '123', expected: '0x7b' },
    { label: 'zero', input: 0, expected: '0x0' },
    { label: 'one', input: 1, expected: '0x1' },
    { label: 'sixteen', input: 16, expected: '0x10' },
    { label: 'zero bigint', input: 0n, expected: '0x0' },
    { label: 'sixteen bigint', input: 16n, expected: '0x10' },
    {
      label: 'legacy BigNumber object',
      input: { _hex: '0x06a11e3d', _isBigNumber: true as const },
      expected: '0x6a11e3d',
    },
  ])('converts $label like ethers v5', ({ input, expected }) => {
    expect(valueToHex(input)).toBe(expected);
  });

  test('handles empty strings', () => {
    expect(valueToHex('')).toBe('');
    expect(valueToHex('', true)).toBe('0x');
  });
});
