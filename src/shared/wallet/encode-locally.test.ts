import { encodeForMasking, decodeMasked } from './encode-locally';

describe.only('encode-locally.ts', () => {
  test('encodeForMasking', () => {
    const value = 'hello';
    expect(decodeMasked(encodeForMasking(value))).toBe(value);
  });

  test('maskedValue is not equal to input value', () => {
    const value = 'something';
    expect(encodeForMasking(value)).not.toBe(value);
  });

  test('encodeForMasking longer text', () => {
    const value =
      "What is Lorem Ipsum?\nLorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s!";
    expect(decodeMasked(encodeForMasking(value))).toBe(value);
  });
});
