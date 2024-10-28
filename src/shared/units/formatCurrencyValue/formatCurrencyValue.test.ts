import { formatCurrencyValue } from './formatCurrencyValue';

describe('formatCurrencyValue', () => {
  const testCases = [
    {
      input: { value: 0.001, locale: 'en', currency: 'usd' },
      output: '$0.00',
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
      output: '₽0.00',
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
    test(`${testCase.input.value} -> ${testCase.output}`, () => {
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
