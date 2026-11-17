import type { AssetFullInfo } from 'src/modules/zerion-api/requests/asset-get-fungible-full-info';
import { isLikelySpam, shouldShowHideTokenHint } from './spam';

function makeFullInfo({
  verified,
  isNew,
  liquidity,
}: {
  verified: boolean;
  isNew: boolean;
  liquidity: number | null;
}): AssetFullInfo {
  return {
    extra: {
      createdAt: '2026-01-01T00:00:00Z',
      description: null,
      holders: null,
      liquidity,
      top10: null,
      volume24h: null,
      relevantResources: [],
      mainChain: 'ethereum',
    },
    fungible: {
      id: 'token',
      iconUrl: null,
      name: 'Token',
      new: isNew,
      symbol: 'TKN',
      verified,
      implementations: {},
      meta: {
        circulatingSupply: null,
        fullyDilutedValuation: null,
        marketCap: null,
        price: null,
        relativeChange1d: null,
        relativeChange30d: null,
        relativeChange90d: null,
        relativeChange365d: null,
        totalSupply: null,
      },
    },
  };
}

describe('isLikelySpam', () => {
  test('verified assets are never spam', () => {
    expect(isLikelySpam(makeFullInfo({ verified: true, isNew: true, liquidity: null }))).toBe(
      false,
    );
  });

  test('unverified new assets are spam regardless of liquidity', () => {
    expect(isLikelySpam(makeFullInfo({ verified: false, isNew: true, liquidity: 5_000_000 }))).toBe(
      true,
    );
  });

  test('unverified assets below the liquidity limit are spam', () => {
    expect(isLikelySpam(makeFullInfo({ verified: false, isNew: false, liquidity: 9_999 }))).toBe(
      true,
    );
  });

  test('unverified assets without liquidity are spam', () => {
    expect(isLikelySpam(makeFullInfo({ verified: false, isNew: false, liquidity: null }))).toBe(
      true,
    );
  });

  test('unverified assets at the liquidity limit are not spam', () => {
    expect(isLikelySpam(makeFullInfo({ verified: false, isNew: false, liquidity: 10_000 }))).toBe(
      false,
    );
  });
});

describe('shouldShowHideTokenHint', () => {
  const spam = makeFullInfo({ verified: false, isNew: true, liquidity: null });

  test('shows once for a likely-spam asset when nothing is hidden', () => {
    expect(
      shouldShowHideTokenHint({
        fullInfo: spam,
        hiddenFungibleIds: [],
        hiddenListReady: true,
        hasSeenHint: false,
        isHidden: false,
      }),
    ).toBe(true);
  });

  test('never shows after it has been seen', () => {
    expect(
      shouldShowHideTokenHint({
        fullInfo: spam,
        hiddenFungibleIds: [],
        hiddenListReady: true,
        hasSeenHint: true,
        isHidden: false,
      }),
    ).toBe(false);
  });

  test('never shows when any token is already hidden', () => {
    expect(
      shouldShowHideTokenHint({
        fullInfo: spam,
        hiddenFungibleIds: ['eth'],
        hiddenListReady: true,
        hasSeenHint: false,
        isHidden: false,
      }),
    ).toBe(false);
  });

  test('never shows for the hidden asset itself', () => {
    expect(
      shouldShowHideTokenHint({
        fullInfo: spam,
        hiddenFungibleIds: [],
        hiddenListReady: true,
        hasSeenHint: false,
        isHidden: true,
      }),
    ).toBe(false);
  });

  test('never shows for a verified asset', () => {
    expect(
      shouldShowHideTokenHint({
        fullInfo: makeFullInfo({ verified: true, isNew: true, liquidity: null }),
        hiddenFungibleIds: [],
        hiddenListReady: true,
        hasSeenHint: false,
        isHidden: false,
      }),
    ).toBe(false);
  });

  test('does not show while the stored hidden list is still loading', () => {
    expect(
      shouldShowHideTokenHint({
        fullInfo: spam,
        hiddenFungibleIds: [],
        hiddenListReady: false,
        hasSeenHint: false,
        isHidden: false,
      }),
    ).toBe(false);
  });

  test('does not show before full info arrives', () => {
    expect(
      shouldShowHideTokenHint({
        fullInfo: undefined,
        hiddenFungibleIds: [],
        hiddenListReady: true,
        hasSeenHint: false,
        isHidden: false,
      }),
    ).toBe(false);
  });
});
