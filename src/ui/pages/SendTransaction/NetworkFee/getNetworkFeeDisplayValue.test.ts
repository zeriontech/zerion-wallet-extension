import { getNetworkFeeDisplayValue } from './getNetworkFeeDisplayValue';

const base = {
  feeValueFormatted: '$3.00',
  feeValuePrefix: '',
  customViewOnly: false,
};

describe('getNetworkFeeDisplayValue', () => {
  test('returns amount only when the level label is rendered separately', () => {
    expect(
      getNetworkFeeDisplayValue({
        ...base,
        speed: 'fast',
        time: '~15 sec',
      }),
    ).toBe('$3.00');
    expect(
      getNetworkFeeDisplayValue({
        ...base,
        speed: 'fast',
        time: undefined,
      }),
    ).toBe('$3.00');
    expect(
      getNetworkFeeDisplayValue({
        ...base,
        speed: 'average',
        time: '~60 sec',
      }),
    ).toBe('$3.00');
    expect(
      getNetworkFeeDisplayValue({
        ...base,
        speed: 'custom',
        time: '~60 sec',
      }),
    ).toBe('$3.00');
  });

  test('preserves the legacy prefix in acceleration flows', () => {
    expect(
      getNetworkFeeDisplayValue({
        ...base,
        customViewOnly: true,
        speed: 'custom',
        time: '~60 sec',
      }),
    ).toBe('~60 sec · Custom · $3.00');
    expect(
      getNetworkFeeDisplayValue({
        ...base,
        customViewOnly: true,
        speed: 'average',
        time: undefined,
      }),
    ).toBe('Slow · $3.00');
    expect(
      getNetworkFeeDisplayValue({
        ...base,
        customViewOnly: true,
        speed: 'fast',
        time: undefined,
      }),
    ).toBe('Fast · $3.00');
    expect(
      getNetworkFeeDisplayValue({
        ...base,
        customViewOnly: true,
        speed: 'custom',
        time: undefined,
      }),
    ).toBe('Custom · $3.00');
  });

  test('returns null without a formatted amount', () => {
    expect(
      getNetworkFeeDisplayValue({
        ...base,
        speed: 'fast',
        feeValueFormatted: undefined,
        time: '~15 sec',
      }),
    ).toBe(null);
  });
});
