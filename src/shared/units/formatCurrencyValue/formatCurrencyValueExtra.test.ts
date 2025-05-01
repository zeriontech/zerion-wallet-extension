import { describe, expect, test } from 'vitest';
import { formatCurrencyValueExtra } from './formatCurrencyValueExtra';

describe('formatCurrencyValueExtra', () => {
  const testCases = [
    {
      input: {
        value: 0.001,
        locale: 'en',
        currency: 'usd',
        opts: { zeroRoundingFallback: 0.01 },
      },
      output: '<$0.01',
    },
    {
      input: {
        value: 0.001,
        locale: 'en',
        currency: 'usd',
        opts: { zeroRoundingFallback: 0 },
      },
      output: '$0.00',
    },
    {
      input: {
        value: 0.001,
        locale: 'en',
        currency: 'rub',
        opts: { zeroRoundingFallback: 0 },
      },
      output: '₽0.00',
    },
    {
      input: {
        value: 0.01,
        locale: 'en',
        currency: 'usd',
        opts: { zeroRoundingFallback: 0.01 },
      },
      output: '$0.01',
    },
    {
      description:
        'when zeroRoundingFallback is less than value, output is expected to be adjusted',
      input: {
        value: 0.000004093,
        locale: 'en',
        currency: 'usd',
        opts: { zeroRoundingFallback: 0.000000001 },
      },
      output: '<$0.00001',
    },
    {
      description:
        'zeroRoundingFallback should NOT be used when formatted output is not zero',
      input: {
        value: 0.023,
        locale: 'en',
        currency: 'usd',
        opts: { zeroRoundingFallback: 0.1 },
      },
      output: '$0.02',
    },
    {
      description: 'zeroRoundingFallback can be larger than one',
      input: {
        value: 0.000293,
        locale: 'en',
        currency: 'eur',
        opts: { zeroRoundingFallback: 10 },
      },
      output: '<€10',
    },
    {
      description: 'zeroRoundingFallback does not need to be a power of 10',
      input: {
        value: 0.000293,
        locale: 'en',
        currency: 'eur',
        opts: { zeroRoundingFallback: 0.035 },
      },
      output: '<€0.035',
    },
    {
      description: 'handle locales other than EN',
      input: {
        value: 0.000293,
        locale: 'ru',
        currency: 'eur',
        opts: { zeroRoundingFallback: 0.035 },
      },
      output: '<0,035 €',
    },
    {
      input: {
        value: 0.00000001,
        locale: 'en',
        currency: 'eth',
        opts: { zeroRoundingFallback: 0.0001 },
      },
      output: '<Ξ0.0001',
    },
    {
      description:
        'eth: when zeroRoundingFallback is less than value, output is expected to be adjusted',
      input: {
        value: 0.0000001,
        locale: 'en',
        currency: 'eth',
        opts: { zeroRoundingFallback: 0.000000001 },
      },
      output: '<Ξ0.000001',
    },
    {
      description:
        'eth: zeroRoundingFallback is less than value, output is expected to be adjusted',
      input: {
        value: 0.0000004,
        locale: 'en',
        currency: 'eth',
        opts: { zeroRoundingFallback: 0.000000003 },
      },
      output: '<Ξ0.000003',
    },
  ];
  for (const testCase of testCases) {
    test(
      testCase.description || `${testCase.input.value} -> ${testCase.output}`,
      () => {
        const { input, output } = testCase;
        const result = formatCurrencyValueExtra(
          input.value,
          input.locale,
          input.currency,
          input.opts
        );
        expect(result).toBe(output);
      }
    );
  }
});
