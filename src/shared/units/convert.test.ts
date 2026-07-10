import { baseToCommon, commonToBase, normalizeNumberValue } from './convert';

test('baseToCommon', () => {
  expect(baseToCommon('8408943752575239', 18).toString()).toBe(
    '0.008408943752575239'
  );
  expect(baseToCommon('33871609663570237017', 18).toString()).toBe(
    '33.871609663570237017'
  );
});

test('baseToCommon parses hex-encoded values', () => {
  // 0xDE0B6B3A7640000 === 10 ** 18 (mixed-case hex, which bignumber.js
  // mishandles on its own, returning NaN)
  expect(baseToCommon('0xDE0b6B3a7640000', 18).toFixed()).toBe('1');
  // The value from WLT-1686: bignumber.js returns NaN for this mixed-case hex
  expect(baseToCommon('0xFFFFFFFFFFFEFFFFFFfFFFFFFFFFFFF', 18).isNaN()).toBe(
    false
  );
  expect(baseToCommon('0xFFFFFFFFFFFEFFFFFFfFFFFFFFFFFFF', 18).toFixed()).toBe(
    baseToCommon('21267647932558578408597187050162094079', 18).toFixed()
  );
});

test('normalizeNumberValue', () => {
  // mixed-case hex -> decimal string
  expect(normalizeNumberValue('0xFFFFFFFFFFFEFFFFFFfFFFFFFFFFFFF')).toBe(
    '21267647932558578408597187050162094079'
  );
  expect(normalizeNumberValue('0xff')).toBe('255');
  // non-hex input is passed through unchanged
  expect(normalizeNumberValue('33871609663570237017')).toBe(
    '33871609663570237017'
  );
  expect(normalizeNumberValue('33.871')).toBe('33.871');
  expect(normalizeNumberValue(42)).toBe(42);
});

test('commonToBase', () => {
  expect(commonToBase('1', 18).toString()).toBe('1000000000000000000');
  expect(commonToBase('33.871609663570237017', 18).toString()).toBe(
    '33871609663570237017'
  );
});
