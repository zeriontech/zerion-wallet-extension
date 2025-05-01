import { describe, expect, test } from 'vitest';
import { intersperce } from './intersperce';

describe('intersperce', () => {
  test('single element', () => {
    expect(intersperce([1], () => null)).toEqual([1]);
  });

  test('empty array', () => {
    expect(intersperce([], () => null)).toEqual([]);
  });

  test('two elements', () => {
    expect(intersperce(['a', 'b'], () => '-')).toEqual(['a', '-', 'b']);
  });

  test('three elements', () => {
    const expected = ['a', '-', 'b', '-', 'c'];
    expect(intersperce(['a', 'b', 'c'], () => '-')).toEqual(expected);
  });

  test('four elements', () => {
    const expected = ['a', '-', 'b', '-', 'c', '-', 'd'];
    expect(intersperce(['a', 'b', 'c', 'd'], () => '-')).toEqual(expected);
  });

  test('four nulls', () => {
    expect(intersperce([null, null, null, null], () => '-')).toEqual([]);
  });

  test('leading null', () => {
    const input = [null, 'b', 'c'];
    const expected = ['b', '-', 'c'];
    expect(intersperce(input, () => '-')).toEqual(expected);
  });

  test('leading null 2', () => {
    const input = [null, null, 'c'];
    const expected = ['c'];
    expect(intersperce(input, () => '-')).toEqual(expected);
  });

  test('trailing null', () => {
    const input = ['a', 'b', null];
    const expected = ['a', '-', 'b'];
    expect(intersperce(input, () => '-')).toEqual(expected);
  });

  test('trailing null 2', () => {
    const input = ['a', null, null];
    const expected = ['a'];
    expect(intersperce(input, () => '-')).toEqual(expected);
  });

  test('middle null', () => {
    const input = ['a', null, 'c'];
    const expected = ['a', '-', 'c'];
    expect(intersperce(input, () => '-')).toEqual(expected);
  });

  test('mixed null', () => {
    const input = ['a', null, 'c', null];
    const expected = ['a', '-', 'c'];
    expect(intersperce(input, () => '-')).toEqual(expected);
  });

  test('mixed null 2', () => {
    const input = [null, 'b', null, 'c'];
    const expected = ['b', '-', 'c'];
    expect(intersperce(input, () => '-')).toEqual(expected);
  });

  test('key parameter', () => {
    const input = [null, 'b', null, 'c', 'd'];
    const expected = ['b', '-1', 'c', '-2', 'd'];
    expect(intersperce(input, (key) => String(key))).toEqual(expected);
  });

  test('index parameter', () => {
    const input = [null, 'b', null, 'c', 'd'];
    const expected = ['b', '1', 'c', '2', 'd'];
    expect(intersperce(input, (_key, index) => String(index))).toEqual(
      expected
    );
  });
});
