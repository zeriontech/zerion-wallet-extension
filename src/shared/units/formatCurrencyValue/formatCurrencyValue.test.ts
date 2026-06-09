import { formatCurrencyValue } from './formatCurrencyValue';

describe('formatCurrencyValue', () => {
  // USD formatting — Style 1 ("amount"). The amount rule lives in
  // formatCurrencyValue and applies to plain fiat currencies (see USD
  // formatting PRD).
  describe('amount rule (USD formatting — Style 1)', () => {
    const cases: Array<[number, string]> = [
      [0, '$0'],
      [0.0000004, '$0.001'],
      [0.000055, '$0.001'],
      [0.001148, '$0.001'],
      [0.0045, '$0.005'],
      [0.0099, '$0.01'],
      [0.01, '$0.01'],
      [0.05, '$0.05'],
      [0.100029, '$0.10'],
      [0.100000000000123, '$0.10'],
      // binary float artifact must not leak into the output
      [0.30000000000000004, '$0.30'],
      [1.234, '$1.23'],
      [1.00000000123, '$1.00'],
      [5.7, '$5.70'],
      [1444.45, '$1,444.45'],
      [123456.78, '$123,456.78'],
    ];
    for (const [input, output] of cases) {
      test(`${input} -> ${output}`, () => {
        expect(formatCurrencyValue(input, 'en', 'usd')).toBe(output);
      });
    }

    test('negative: sign goes before the symbol', () => {
      // repo convention uses the typographic minus (U+2212)
      expect(formatCurrencyValue(-1.23, 'en', 'usd')).toBe('−$1.23');
    });

    test('NaN -> en dash', () => {
      expect(formatCurrencyValue(NaN, 'en', 'usd')).toBe('–');
    });

    test('never uses the subscript short form', () => {
      expect(formatCurrencyValue(0.0000000012, 'en', 'usd')).toBe('$0.001');
    });

    test('never uses the < prefix', () => {
      expect(formatCurrencyValue(0.0000004, 'en', 'usd')).not.toContain('<');
    });
  });

  const testCases = [
    {
      input: { value: 0.001, locale: 'en', currency: 'usd' },
      output: '$0.001',
    },
    {
      input: { value: 84520.92955176056, locale: 'ru', currency: 'rub' },
      output: '84 520,93 ₽',
    },
    {
      input: { value: 84520.92955176056, locale: 'ru', currency: 'usd' },
      output: '84 520,93 $',
    },
    {
      input: { value: 0.001, locale: 'en', currency: 'rub' },
      output: '₽0.001',
    },
    {
      input: { value: 12345.039, locale: 'en', currency: 'rub' },
      output: '₽12,345.04',
    },
    {
      input: { value: 0.01, locale: 'en', currency: 'usd' },
      output: '$0.01',
    },
    {
      input: { value: 0.0001, locale: 'en', currency: 'eth' },
      output: 'Ξ0.0001',
    },
    {
      input: { value: 2.0001, locale: 'en', currency: 'eth' },
      output: 'Ξ2.0001',
    },
    {
      input: { value: 2.0000031, locale: 'en', currency: 'eth' },
      output: 'Ξ2.00',
    },
    {
      input: { value: 2.00039, locale: 'en', currency: 'eth' },
      output: 'Ξ2.0004',
    },
    {
      input: { value: 2.00639, locale: 'en', currency: 'eth' },
      output: 'Ξ2.0064',
    },
    {
      input: { value: 84520.92155176056, locale: 'en', currency: 'try' },
      output: '₺84,520.92',
    },
  ];
  for (const testCase of testCases) {
    test(`${testCase.input.value} ${testCase.input.currency} -> ${testCase.output}`, () => {
      const { input, output } = testCase;
      const result = formatCurrencyValue(
        input.value,
        input.locale,
        input.currency
      );
      expect(result).toBe(output);
    });
  }
});
