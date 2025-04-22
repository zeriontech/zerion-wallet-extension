import { describe, expect, test } from 'vitest';
import { truncateAddress } from './truncateAddress';
import { ellipsis } from './typography';

describe('truncateAddress', () => {
  test('with 0x prefix', () => {
    const address = '0x7358B726830A2E222f9b139E90483A37142bcBE5';
    const expected = `0x7358B7${ellipsis}2bcBE5`;
    expect(truncateAddress(address)).toBe(expected);
  });

  test('without 0x prefix', () => {
    const address = '7358B726830A2E222f9b139E90483A37142bcBE5';
    const expected = `7358B7${ellipsis}2bcBE5`;
    expect(truncateAddress(address)).toBe(expected);
  });

  test('custom padding', () => {
    const address = '0x7358B726830A2E222f9b139E90483A37142bcBE5';
    const expected = `0x7358${ellipsis}cBE5`;
    expect(truncateAddress(address, 4)).toBe(expected);
  });

  test('short address handling', () => {
    const shortAddress = '0x1234';
    const expected = `0x1234${ellipsis}0x1234`;
    expect(truncateAddress(shortAddress)).toBe(expected);
  });

  test('padding of 3 characters', () => {
    const address = '0x7358B726830A2E222f9b139E90483A37142bcBE5';
    const expected = `0x735${ellipsis}BE5`;
    expect(truncateAddress(address, 3)).toBe(expected);
  });

  test('padding of 8 characters', () => {
    const address = '0x7358B726830A2E222f9b139E90483A37142bcBE5';
    const expected = `0x7358B726${ellipsis}142bcBE5`;
    expect(truncateAddress(address, 8)).toBe(expected);
  });
});
