import { resolveIsCross } from './resolveIsCross';

describe('resolveIsCross', () => {
  test('greenfield open on a cross-capable asset defaults to cross', () => {
    expect(
      resolveIsCross({ positionMarginType: null, onlyIsolated: false })
    ).toBe(true);
    expect(resolveIsCross({ positionMarginType: null })).toBe(true);
  });

  test('greenfield open on an isolated-only asset (e.g. para:AVGO) uses isolated', () => {
    expect(
      resolveIsCross({ positionMarginType: null, onlyIsolated: true })
    ).toBe(false);
  });

  test('existing position dictates the margin type', () => {
    expect(
      resolveIsCross({ positionMarginType: 'isolated', onlyIsolated: false })
    ).toBe(false);
    expect(
      resolveIsCross({ positionMarginType: 'cross', onlyIsolated: false })
    ).toBe(true);
    expect(
      resolveIsCross({ positionMarginType: 'isolated', onlyIsolated: true })
    ).toBe(false);
  });
});
