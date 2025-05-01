import { test, expect } from 'vitest';
import { baseToCommon, commonToBase } from './convert';

test('baseToCommon', () => {
  expect(baseToCommon('8408943752575239', 18).toString()).toBe(
    '0.008408943752575239'
  );
  expect(baseToCommon('33871609663570237017', 18).toString()).toBe(
    '33.871609663570237017'
  );
});

test('commonToBase', () => {
  expect(commonToBase('1', 18).toString()).toBe('1000000000000000000');
  expect(commonToBase('33.871609663570237017', 18).toString()).toBe(
    '33871609663570237017'
  );
});
