import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  base64ToUint8Array,
  uint8ArrayToBase64,
} from './convert';

describe.skip('crypto/convert', () => {
  describe('base64ToArrayBuffer, arrayBufferToBase64', () => {
    test('it roundtrips', () => {
      const base64A = 'Qyqe9Q0l1wIzjMILPP0eeXFRoXzz8ZUYZdnh9ghMurY=';
      const arrayBuffer = base64ToArrayBuffer(base64A);
      const base64B = arrayBufferToBase64(arrayBuffer);

      expect(base64A).toBe(base64B);
    });
  });

  describe('base64ToUint8Array, uint8ArrayToBase64', () => {
    test('it roundtrips', () => {
      const base64A = 'yFoOtyDMPHA0kLfBiy5bIATBt3Ytl5AbZBVrydxjRF8=';
      const array = base64ToUint8Array(base64A);
      const base64B = uint8ArrayToBase64(array);

      expect(base64A).toBe(base64B);
    });
  });
});
