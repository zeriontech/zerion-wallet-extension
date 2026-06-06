import { formatPriceValue } from './formatPriceValue';

describe('formatPriceValue (USD formatting — Style 2)', () => {
  const cases: Array<[number, string]> = [
    [0, '$0'],
    [1444.45, '$1,444.45'],
    [1.2345, '$1.23'],
    [1.00000000123, '$1.00'],
    [0.99, '$0.99'],
    [0.5, '$0.50'],
    [0.100000000000123, '$0.10'],
    [0.30000000000000004, '$0.30'],
    [0.012345, '$0.01235'],
    [0.0123, '$0.0123'],
    [0.001234, '$0.001234'],
    [0.000000012, '$0.000000012'],
    [0.0000000012, '$0.0₈12'],
    [0.000000000000123, '$0.0₁₂123'],
  ];
  for (const [input, output] of cases) {
    test(`${input} -> ${output}`, () => {
      expect(formatPriceValue(input, 'en', 'usd')).toBe(output);
    });
  }

  test('subscript boundary: 7 zeros stays full, 8 zeros switches', () => {
    expect(formatPriceValue(0.000000012, 'en', 'usd')).toBe('$0.000000012');
    expect(formatPriceValue(0.0000000012, 'en', 'usd')).toBe('$0.0₈12');
  });

  test('1e-15 uses the subscript short form', () => {
    expect(formatPriceValue(1e-15, 'en', 'usd')).toBe('$0.0₁₄1');
  });

  test('subscript respects currency symbol (eth)', () => {
    expect(formatPriceValue(0.0000000012, 'en', 'eth')).toBe('Ξ0.0₈12');
  });

  test('pads to 2 decimals in comma-decimal locales (ru)', () => {
    // V8 drops minimumFractionDigits under maximumSignificantDigits; the
    // locale-aware pad must restore the trailing zero using the ru comma
    // separator. ru puts a no-break space before the symbol, so normalize
    // whitespace and check the digits/separator, not the exact space codepoint.
    const result = formatPriceValue(0.5, 'ru', 'eur').replace(/\s/g, ' ');
    expect(result).toBe('0,50 €');
  });
});
