import { describe, expect, test } from 'vitest';
import { updateRecentAddresses } from './updateRecentAddresses';

describe('updateRecentAddresses', () => {
  test('empty state', () => {
    expect(updateRecentAddresses('0', [])).toEqual(['0']);
  });

  test('new item', () => {
    // prettier-ignore
    expect(updateRecentAddresses(
      '3',
      ['0','1','2']
    )).toEqual(
      ['3','0','1','2']);
  });

  test('new item in big array', () => {
    // prettier-ignore
    expect(updateRecentAddresses(
      '16',
      ['0','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15']
    )).toEqual(
      ['16','0','1','2','3','4','5','6','7','8','9','10','11','12','13','14']
    );
  });

  test('existing item in small array', () => {
    // prettier-ignore
    expect(updateRecentAddresses(
      '3',
      ['0','1','2','3','4','5']
    )).toEqual(
      ['3','0','1','2','4','5']
    );
  });

  test('existing item is first', () => {
    // prettier-ignore
    expect(updateRecentAddresses(
      '0',
      ['0','1','2','3','4','5']
    )).toEqual(
      ['0','1','2','3','4','5']
    );
  });

  test('existing item is last', () => {
    // prettier-ignore
    expect(updateRecentAddresses(
      '5',
      ['0','1','2','3','4','5']
    )).toEqual(
      ['5','0','1','2','3','4']
    );
  });

  test('existing item in big array', () => {
    // prettier-ignore
    expect(updateRecentAddresses(
      '7',
      ['0','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15']
    )).toEqual(
      ['7','0','1','2','3','4','5','6','8','9','10','11','12','13','14','15']
  );
  });
});
