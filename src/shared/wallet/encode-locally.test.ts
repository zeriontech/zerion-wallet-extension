import { describe, expect, test } from 'vitest';
import { unwrapOpaqueType } from '../type-utils/Opaque';
import { encodeForMasking, decodeMasked } from './encode-locally';

describe.only('encode-locally.ts', () => {
  test('encodeForMasking', () => {
    const value = 'hello';
    expect(decodeMasked(encodeForMasking(value))).toBe(value);
  });

  test('maskedValue is not equal to input value', () => {
    const value = 'something';
    const encoded = encodeForMasking(value);
    expect(encoded).not.toBe(value);
  });

  test('maskedValue and value are not substrings of each other', () => {
    const values = ['one two three', '000000', '#$%@#$=='];
    values.forEach((value) => {
      const encoded = encodeForMasking(value);
      const encodedString = unwrapOpaqueType(encoded);
      expect(value.includes(encodedString)).toBe(false);
      expect(encodedString.includes(value)).toBe(false);
    });
  });

  test('encodeForMasking longer text', () => {
    const value =
      "What is Lorem Ipsum?\nLorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s!";
    expect(decodeMasked(encodeForMasking(value))).toBe(value);
  });
});
