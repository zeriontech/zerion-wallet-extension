import type {
  PerpAssetMarketData,
  PerpMetaAndAssetCtxsResponse,
  PerpUniverseAsset,
} from './api/requests/perp-meta-and-asset-ctxs.types';
import { DEFAULT_SORTING, selectPerps } from './selectPerps';

function asset(
  overrides: Partial<PerpUniverseAsset> & Pick<PerpUniverseAsset, 'name'>
): PerpUniverseAsset {
  return {
    szDecimals: 2,
    maxLeverage: 20,
    ...overrides,
  };
}

function ctx(overrides: Partial<PerpAssetMarketData>): PerpAssetMarketData {
  return {
    funding: '0',
    openInterest: '0',
    prevDayPx: '100',
    dayNtlVlm: '0',
    premium: null,
    oraclePx: '100',
    markPx: '100',
    midPx: null,
    impactPxs: null,
    dayBaseVlm: '0',
    ...overrides,
  };
}

function response(
  assets: PerpUniverseAsset[],
  ctxs: PerpAssetMarketData[]
): PerpMetaAndAssetCtxsResponse {
  return [{ universe: assets }, ctxs];
}

describe('selectPerps', () => {
  test('merges multiple DEX responses into one list', () => {
    const main = response(
      [asset({ name: 'BTC' }), asset({ name: 'ETH' })],
      [ctx({ markPx: '65000' }), ctx({ markPx: '3000' })]
    );
    const stocks = response(
      [asset({ name: 'xyz:NVDA' })],
      [ctx({ markPx: '120' })]
    );

    const result = selectPerps([main, stocks], { sorting: DEFAULT_SORTING });

    expect(result.map((p) => p.name)).toEqual(
      expect.arrayContaining(['BTC', 'ETH', 'xyz:NVDA'])
    );
    expect(result).toHaveLength(3);
  });

  test('skips null/undefined DEX entries', () => {
    const main = response([asset({ name: 'BTC' })], [ctx({})]);
    const result = selectPerps([main, null, undefined], {
      sorting: DEFAULT_SORTING,
    });
    expect(result).toHaveLength(1);
  });

  test('filters delisted assets', () => {
    const data = response(
      [asset({ name: 'BTC' }), asset({ name: 'OLD', isDelisted: true })],
      [ctx({}), ctx({})]
    );
    const result = selectPerps([data], { sorting: DEFAULT_SORTING });
    expect(result.map((p) => p.name)).toEqual(['BTC']);
  });

  test('skips assets with no matching ctx', () => {
    const data = response(
      [asset({ name: 'BTC' }), asset({ name: 'ETH' })],
      [ctx({})] // only one ctx for two assets
    );
    const result = selectPerps([data], { sorting: DEFAULT_SORTING });
    expect(result.map((p) => p.name)).toEqual(['BTC']);
  });

  test('derives relativeChange1d from markPx/prevDayPx', () => {
    const data = response(
      [asset({ name: 'BTC' })],
      [ctx({ markPx: '110', prevDayPx: '100' })]
    );
    const [perp] = selectPerps([data], { sorting: DEFAULT_SORTING });
    expect(perp.meta.relativeChange1d).toBeCloseTo(0.1);
    expect(perp.meta.price).toBe(110);
  });

  test('relativeChange1d is null when prevDayPx is 0', () => {
    const data = response(
      [asset({ name: 'BTC' })],
      [ctx({ markPx: '110', prevDayPx: '0' })]
    );
    const [perp] = selectPerps([data], { sorting: DEFAULT_SORTING });
    expect(perp.meta.relativeChange1d).toBeNull();
  });

  test('derives volume24h from dayNtlVlm', () => {
    const data = response(
      [asset({ name: 'BTC' })],
      [ctx({ dayNtlVlm: '1200000000' })]
    );
    const [perp] = selectPerps([data], { sorting: DEFAULT_SORTING });
    expect(perp.meta.volume24h).toBe(1_200_000_000);
  });

  test('symbol strips the xyz: prefix; name keeps it', () => {
    const data = response([asset({ name: 'xyz:NVDA' })], [ctx({})]);
    const [perp] = selectPerps([data], { sorting: DEFAULT_SORTING });
    expect(perp.symbol).toBe('NVDA');
    expect(perp.name).toBe('xyz:NVDA');
    expect(perp.id).toBe('xyz:NVDA');
  });

  test('sorts by volume descending by default', () => {
    const data = response(
      [asset({ name: 'LOW' }), asset({ name: 'HIGH' }), asset({ name: 'MID' })],
      [
        ctx({ dayNtlVlm: '100' }),
        ctx({ dayNtlVlm: '300' }),
        ctx({ dayNtlVlm: '200' }),
      ]
    );
    const result = selectPerps([data], { sorting: DEFAULT_SORTING });
    expect(result.map((p) => p.name)).toEqual(['HIGH', 'MID', 'LOW']);
  });

  test('sorts by price descending', () => {
    const data = response(
      [asset({ name: 'A' }), asset({ name: 'B' })],
      [ctx({ markPx: '10' }), ctx({ markPx: '20' })]
    );
    const result = selectPerps([data], {
      sorting: { field: 'price', direction: 'desc' },
    });
    expect(result.map((p) => p.name)).toEqual(['B', 'A']);
  });

  test('sorts by change descending', () => {
    const data = response(
      [asset({ name: 'A' }), asset({ name: 'B' })],
      [
        ctx({ markPx: '105', prevDayPx: '100' }), // +5%
        ctx({ markPx: '120', prevDayPx: '100' }), // +20%
      ]
    );
    const result = selectPerps([data], {
      sorting: { field: 'change', direction: 'desc' },
    });
    expect(result.map((p) => p.name)).toEqual(['B', 'A']);
  });

  test('null metrics sort last regardless of direction', () => {
    const data = response(
      [asset({ name: 'WITH' }), asset({ name: 'WITHOUT' })],
      [ctx({ dayNtlVlm: '100' }), ctx({ dayNtlVlm: 'not-a-number' })]
    );
    const desc = selectPerps([data], {
      sorting: { field: 'volume', direction: 'desc' },
    });
    expect(desc.map((p) => p.name)).toEqual(['WITH', 'WITHOUT']);
    const asc = selectPerps([data], {
      sorting: { field: 'volume', direction: 'asc' },
    });
    expect(asc.map((p) => p.name)).toEqual(['WITH', 'WITHOUT']);
  });

  test('limit slices the result', () => {
    const data = response(
      [asset({ name: 'A' }), asset({ name: 'B' }), asset({ name: 'C' })],
      [
        ctx({ dayNtlVlm: '300' }),
        ctx({ dayNtlVlm: '200' }),
        ctx({ dayNtlVlm: '100' }),
      ]
    );
    const result = selectPerps([data], { sorting: DEFAULT_SORTING, limit: 2 });
    expect(result.map((p) => p.name)).toEqual(['A', 'B']);
  });

  test('query filters by symbol and name (case-insensitive)', () => {
    const data = response(
      [asset({ name: 'BTC' }), asset({ name: 'xyz:NVDA' })],
      [ctx({}), ctx({})]
    );
    const result = selectPerps([data], {
      sorting: DEFAULT_SORTING,
      query: 'nvda',
    });
    expect(result.map((p) => p.name)).toEqual(['xyz:NVDA']);
  });
});
