import { hasChecksumError } from './toChecksumAddress';

test('hasChecksumError', () => {
  const checksummed = '0xbF6875457265C0fD039eD955546E75163Ae63631';
  const lowercased = checksummed.toLowerCase();
  const uppercased = '0x' + checksummed.slice(2).toUpperCase();
  const invalidMixedcase = '0xBF6875457265C0fD039eD955546E75163Ae63631';

  expect(hasChecksumError(checksummed)).toBe(false);
  expect(hasChecksumError(lowercased)).toBe(false);
  expect(hasChecksumError(uppercased)).toBe(false);
  expect(hasChecksumError(invalidMixedcase)).toBe(true);
});
