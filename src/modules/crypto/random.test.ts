import { getRandomBase64 } from './random';

describe.skip('crypto/random', () => {
  describe('getRandomBase64', () => {
    it('Respects a given length', () => {
      const s = getRandomBase64(42);
      expect(s.length).toBe(42);
    });

    it('Generates a unique base64 string', () => {
      const s1 = getRandomBase64(12);
      const s2 = getRandomBase64(12);

      expect(s1).not.toBe(s2);
    });
  });
});
