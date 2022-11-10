import { createCryptoKey, createSalt } from './key';

describe.skip('crypto/key', () => {
  test('createCryptoKey', async () => {
    const salt = createSalt();
    const key = await createCryptoKey('secret', salt);
    expect(key).toBeDefined();
  });
});
