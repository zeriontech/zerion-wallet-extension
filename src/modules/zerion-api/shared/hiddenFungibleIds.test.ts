import {
  appendHiddenFungibleIds,
  normalizeHiddenFungibleIds,
  withNormalizedHiddenFungibleIds,
} from './hiddenFungibleIds';

describe('hiddenFungibleIds', () => {
  test('drops empty entries, deduplicates and sorts without changing spelling', () => {
    expect(
      normalizeHiddenFungibleIds([
        'usdc',
        '',
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        'usdc',
        'ETH',
      ]),
    ).toEqual(['0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 'ETH', 'usdc']);
  });

  test('returns an empty list for missing input', () => {
    expect(normalizeHiddenFungibleIds(undefined)).toEqual([]);
    expect(normalizeHiddenFungibleIds(null)).toEqual([]);
    expect(normalizeHiddenFungibleIds([])).toEqual([]);
  });

  test('never truncates: 501 effective ids stay 501', () => {
    const ids = Array.from({ length: 501 }, (_, index) => `token-${index}`);
    expect(normalizeHiddenFungibleIds(ids)).toHaveLength(501);
  });

  test('removes the body field when the effective list is empty', () => {
    const params = {
      addresses: ['0x123'],
      currency: 'usd',
      hiddenFungibleIds: ['', ''],
    };
    expect(withNormalizedHiddenFungibleIds(params)).toEqual({
      addresses: ['0x123'],
      currency: 'usd',
    });
  });

  test('normalizes the body field when the list is non-empty', () => {
    const params = {
      addresses: ['0x123'],
      currency: 'usd',
      hiddenFungibleIds: ['usdc', '', 'eth', 'usdc'],
    };
    expect(withNormalizedHiddenFungibleIds(params)).toEqual({
      addresses: ['0x123'],
      currency: 'usd',
      hiddenFungibleIds: ['eth', 'usdc'],
    });
  });

  test('appends one repeated query key per id, never a joined value', () => {
    const params = appendHiddenFungibleIds(
      new URLSearchParams({ address: '0x123', currency: 'usd' }),
      ['usdc', '', 'eth', 'usdc'],
    );
    expect(params.getAll('hiddenFungibleIds')).toEqual(['eth', 'usdc']);
    expect(params.toString()).toBe(
      'address=0x123&currency=usd&hiddenFungibleIds=eth&hiddenFungibleIds=usdc',
    );
  });
});
