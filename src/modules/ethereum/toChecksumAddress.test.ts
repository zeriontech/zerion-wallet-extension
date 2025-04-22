import { expect, test } from 'vitest';
import { hasChecksumError } from './toChecksumAddress';

test.only('hasChecksumError', () => {
  const checksummed = '0xbF6875457265C0fD039eD955546E75163Ae63631';
  const lowercased = checksummed.toLowerCase();
  const invalidUppercase = checksummed.toUpperCase();
  const invalidMixedcase = '0xBF6875457265C0fD039eD955546E75163Ae63631';

  expect(hasChecksumError(checksummed)).toBe(false);
  expect(hasChecksumError(lowercased)).toBe(false);
  expect(hasChecksumError(invalidUppercase)).toBe(true);
  expect(hasChecksumError(invalidMixedcase)).toBe(true);
});
