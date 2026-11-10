import type { NetworkFeeQuote } from './getNetworkFeeForSpeed';
import { formatNetworkFee } from './formatNetworkFee';

function makeQuote({
  value = null,
  quantity = '0.001',
  currency = 'usd',
  symbol = null,
}: {
  value?: number | null;
  quantity?: string | null;
  currency?: string | null;
  symbol?: string | null;
}): NetworkFeeQuote {
  return {
    networkFee: {
      free: false,
      amount: quantity == null && value == null ? null : { quantity, value, currency },
      fungible: symbol ? { symbol } : null,
    },
  } as unknown as NetworkFeeQuote;
}

describe('formatNetworkFee', () => {
  test('uses the shared fiat fallback when amount.value is null', () => {
    const quote = makeQuote({ value: null, quantity: '0.001' });
    expect(
      formatNetworkFee(quote, 2, {
        fallbackFiatValue: 3,
        fallbackSymbol: 'ETH',
        currency: 'usd',
      }),
    ).toBe('$6.00');
  });

  test('uses the native symbol fallback for a token quantity', () => {
    const quote = makeQuote({ value: null, symbol: null });
    expect(formatNetworkFee(quote, 1, { fallbackSymbol: 'ETH' })).toBe('0.001\u00a0ETH');
  });

  test('does not depend on the quote having a fungible symbol', () => {
    const quote = makeQuote({ value: null, symbol: null });
    expect(formatNetworkFee(quote)).toBe('0.001');
  });

  test('prefers the quote fiat value over the fallback', () => {
    const quote = makeQuote({ value: 3, symbol: 'ETH' });
    expect(
      formatNetworkFee(quote, 2, {
        fallbackFiatValue: 100,
        currency: 'usd',
      }),
    ).toBe('$6.00');
  });

  test('keeps Free', () => {
    const quote = {
      networkFee: { free: true, amount: null, fungible: null },
    } as unknown as NetworkFeeQuote;
    expect(formatNetworkFee(quote)).toBe('Free');
  });
});
