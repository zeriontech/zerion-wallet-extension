import { isWhitelistedForZerionRpc } from './zerion-rpc-whitelist';

test('isWhitelistedForZerionRpc', () => {
  expect(isWhitelistedForZerionRpc('https://safe.global')).toBe(true);
  expect(isWhitelistedForZerionRpc('https://app.safe.global')).toBe(true);

  expect(isWhitelistedForZerionRpc('https://app.uniswap.org')).toBe(false);
  expect(isWhitelistedForZerionRpc('https://notsafe.global')).toBe(false);
  expect(isWhitelistedForZerionRpc('https://safe.global.evil.com')).toBe(false);

  expect(isWhitelistedForZerionRpc(undefined)).toBe(false);
  expect(isWhitelistedForZerionRpc('')).toBe(false);
  expect(isWhitelistedForZerionRpc('not-a-url')).toBe(false);
});
