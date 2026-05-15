import { derivePreflightState, type PreflightRawState } from './preflightState';

const EMPTY_RAW: PreflightRawState = {
  userRole: null,
  referral: null,
  maxBuilderFee: null,
  clearinghouseState: null,
};

describe('derivePreflightState', () => {
  test('null /info responses → everything false, leverage null', () => {
    const state = derivePreflightState(EMPTY_RAW, {
      requiredMaxBuilderFee: 100,
    });
    expect(state).toEqual({
      hyperliquidEnabled: false,
      referrerSet: false,
      builderFeeApproved: false,
      currentLeverage: null,
    });
  });

  test('user role "missing" → hyperliquidEnabled = false', () => {
    const state = derivePreflightState(
      { ...EMPTY_RAW, userRole: { role: 'missing' } },
      { requiredMaxBuilderFee: 100 }
    );
    expect(state.hyperliquidEnabled).toBe(false);
  });

  test('user role "user" → hyperliquidEnabled = true', () => {
    const state = derivePreflightState(
      { ...EMPTY_RAW, userRole: { role: 'user' } },
      { requiredMaxBuilderFee: 100 }
    );
    expect(state.hyperliquidEnabled).toBe(true);
  });

  test('referral.referredBy present → referrerSet = true', () => {
    const state = derivePreflightState(
      {
        ...EMPTY_RAW,
        referral: { referredBy: { referrer: '0xabc', code: 'ZERION' } },
      },
      { requiredMaxBuilderFee: 100 }
    );
    expect(state.referrerSet).toBe(true);
  });

  test('approved builder fee >= required → builderFeeApproved = true', () => {
    const state = derivePreflightState(
      { ...EMPTY_RAW, maxBuilderFee: 100 },
      { requiredMaxBuilderFee: 100 }
    );
    expect(state.builderFeeApproved).toBe(true);
  });

  test('approved builder fee < required → builderFeeApproved = false', () => {
    const state = derivePreflightState(
      { ...EMPTY_RAW, maxBuilderFee: 50 },
      { requiredMaxBuilderFee: 100 }
    );
    expect(state.builderFeeApproved).toBe(false);
  });

  function clearinghouseWithPosition(
    coin: string,
    leverage: { type: 'cross' | 'isolated'; value: number }
  ): PreflightRawState['clearinghouseState'] {
    return {
      marginSummary: {
        accountValue: '0',
        totalNtlPos: '0',
        totalRawUsd: '0',
        totalMarginUsed: '0',
      },
      crossMarginSummary: {
        accountValue: '0',
        totalNtlPos: '0',
        totalRawUsd: '0',
        totalMarginUsed: '0',
      },
      withdrawable: '0',
      assetPositions: [
        {
          type: 'oneWay',
          position: {
            coin,
            szi: '0.001',
            entryPx: '50000',
            positionValue: '50',
            leverage,
            marginUsed: '0',
            unrealizedPnl: '0',
            returnOnEquity: '0',
            liquidationPx: null,
            maxLeverage: 50,
            cumFunding: { allTime: '0', sinceChange: '0', sinceOpen: '0' },
          },
        },
      ],
      time: 0,
    };
  }

  test('currentLeverage read from clearinghouse position when coin matches', () => {
    const state = derivePreflightState(
      {
        ...EMPTY_RAW,
        clearinghouseState: clearinghouseWithPosition('BTC', {
          type: 'cross',
          value: 7,
        }),
      },
      { requiredMaxBuilderFee: 100, coin: 'BTC' }
    );
    expect(state.currentLeverage).toEqual({ value: 7, isCross: true });
  });

  test('isolated position → currentLeverage.isCross = false', () => {
    const state = derivePreflightState(
      {
        ...EMPTY_RAW,
        clearinghouseState: clearinghouseWithPosition('xyz:SP500', {
          type: 'isolated',
          value: 1,
        }),
      },
      { requiredMaxBuilderFee: 100, coin: 'xyz:SP500' }
    );
    expect(state.currentLeverage).toEqual({ value: 1, isCross: false });
  });

  test('coin lookup is case-insensitive (builder-DEX prefix casing)', () => {
    const state = derivePreflightState(
      {
        ...EMPTY_RAW,
        clearinghouseState: clearinghouseWithPosition('xyz:SP500', {
          type: 'isolated',
          value: 3,
        }),
      },
      { requiredMaxBuilderFee: 100, coin: 'XYZ:sp500' }
    );
    expect(state.currentLeverage).toEqual({ value: 3, isCross: false });
  });

  test('no coin provided → currentLeverage = null even with positions present', () => {
    const state = derivePreflightState(EMPTY_RAW, {
      requiredMaxBuilderFee: 100,
    });
    expect(state.currentLeverage).toBeNull();
  });
});
