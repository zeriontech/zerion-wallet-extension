import type { GroupedFungiblePosition } from 'src/ui/components/Positions/types';
import { getAssetChange24h } from './helpers';

function position(
  overrides: Partial<GroupedFungiblePosition> & {
    priceChange?: number | null;
  }
): GroupedFungiblePosition {
  const { priceChange = null, ...rest } = overrides;
  return {
    id: 'p',
    type: 'asset',
    convertedQuantity: 1,
    value: 0,
    chains: [],
    asset: {
      id: 'a',
      name: 'A',
      symbol: 'A',
      implementations: {},
      iconUrl: null,
      price:
        priceChange == null
          ? null
          : { value: 1, relativeChange24h: priceChange, changedAt: 0 },
      isDisplayable: true,
      isVerified: true,
      isNew: false,
    },
    ...rest,
  };
}

describe('getAssetChange24h', () => {
  test('returns null without any position or change', () => {
    expect(getAssetChange24h([])).toBeNull();
    expect(getAssetChange24h([position({ value: 10 })])).toBeNull();
  });

  test('keeps the backend figures of a single position verbatim', () => {
    expect(
      getAssetChange24h([
        position({
          value: 2275,
          relativeChange24h: 42.45,
          absoluteChange24h: 683.82,
        }),
      ])
    ).toEqual({ relative: 42.45, absolute: 683.82 });
  });

  test('falls back to the price move with the value 24h ago as base', () => {
    const change = getAssetChange24h([
      position({ value: 2275, priceChange: 165.2 }),
    ]);
    expect(change?.relative).toBe(165.2);
    expect(change?.absolute).toBeCloseTo(1417.16, 1);
  });

  test('sums several positions and re-derives the percentage', () => {
    const change = getAssetChange24h([
      position({ value: 110, relativeChange24h: 10, absoluteChange24h: 10 }),
      position({ value: 90, relativeChange24h: -10, absoluteChange24h: -10 }),
      position({ value: 5 }), // no figure, ignored
    ]);
    expect(change).toEqual({ relative: 0, absolute: 0 });
  });

  test('drops the percentage when the value 24h ago is not positive', () => {
    const change = getAssetChange24h([
      position({ value: 100, relativeChange24h: 100, absoluteChange24h: 50 }),
      position({ value: 0, relativeChange24h: 0, absoluteChange24h: 0 }),
    ]);
    expect(change).toEqual({ relative: 100, absolute: 50 });
    const bought = getAssetChange24h([
      position({ value: 50, relativeChange24h: 0, absoluteChange24h: 50 }),
      position({ value: 0, relativeChange24h: 0, absoluteChange24h: 0 }),
    ]);
    expect(bought).toEqual({ relative: null, absolute: 50 });
  });
});
