import { describe, test, expect } from 'vitest';
import { decrypt, encrypt } from './aes';

describe('encrypt function', () => {
  test('encrypted value is the same after decryption', async () => {
    const value = { name: 'apple' };

    const password = 'test-123';
    const encrypted = await encrypt(password, value);
    expect(encrypted).not.toBe(JSON.stringify(value));

    const decrypted = await decrypt(password, encrypted);
    expect(decrypted).toEqual(value);
  });

  test('very large value is encrypted correctly', async () => {
    function createVeryLargeString() {
      // A large string will at some point be split into bytes by the encrypting function
      // and those bytes may be passed as arguments, but browsers have a different
      // limit on maximum number of agruments: https://stackoverflow.com/a/22747272/3523645
      // As a solution we avoid doing that and have this test as a guard, but its outcome
      // may differ across javascript environments
      const uint8Array = crypto.getRandomValues(new Uint8Array(65536));
      return uint8Array.reduce((str, c) => str + String.fromCharCode(c), '');
    }
    const largeValue = { message: createVeryLargeString() };

    const password = 'test-123';
    const encrypted = await encrypt(password, largeValue);
    expect(encrypted).not.toBe(JSON.stringify(largeValue));

    const decrypted = await decrypt(password, encrypted);
    expect(decrypted).toEqual(largeValue);
  });
});
