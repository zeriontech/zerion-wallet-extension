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

  test('currentLeverage read from clearinghouse position when coin matches', () => {
    const state = derivePreflightState(
      {
        ...EMPTY_RAW,
        clearinghouseState: {
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
                coin: 'BTC',
                szi: '0.001',
                entryPx: '50000',
                positionValue: '50',
                leverage: { type: 'cross', value: 7 },
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
        },
      },
      { requiredMaxBuilderFee: 100, coin: 'BTC' }
    );
    expect(state.currentLeverage).toBe(7);
  });

  test('no coin provided → currentLeverage = null even with positions present', () => {
    const state = derivePreflightState(EMPTY_RAW, {
      requiredMaxBuilderFee: 100,
    });
    expect(state.currentLeverage).toBeNull();
  });
});
