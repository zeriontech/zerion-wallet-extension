import React from 'react';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { formatPriceValue } from 'src/shared/units/formatPriceValue';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { registerPreviewPermanent } from './registerPreview';

/**
 * Visual check for the USD formatting PRD. `formatCurrencyValue` carries the
 * "amount" rule (Style 1); `formatPriceValue` carries the "price" rule
 * (Style 2). The `expected` column is the PRD's expected output — eyeball it
 * against the rendered value.
 */

// `NaN` can't be a plain object key, so cases are tuples: [input, expected].
type Case = [number, string];

const AMOUNT_CASES: Case[] = [
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
  [0.30000000000000004, '$0.30'],
  [1.234, '$1.23'],
  [1.00000000123, '$1.00'],
  [5.7, '$5.70'],
  [1444.45, '$1,444.45'],
  [123456.78, '$123,456.78'],
  [-1.23, '-$1.23'],
  [NaN, '–'],
];

const PRICE_CASES: Case[] = [
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
  [NaN, '–'],
];

function CaseRow({
  input,
  expected,
  actual,
}: {
  input: number;
  expected: string;
  actual: string;
}) {
  const matches = actual === expected;
  return (
    <HStack
      gap={16}
      alignItems="center"
      style={{
        gridTemplateColumns: '200px 120px 120px 1fr',
        display: 'grid',
      }}
    >
      <UIText kind="small/regular" color="var(--neutral-600)">
        {Number.isNaN(input) ? 'NaN' : String(input)}
      </UIText>
      <UIText kind="body/accent">{actual}</UIText>
      <UIText kind="small/regular" color="var(--neutral-500)">
        {expected}
      </UIText>
      <UIText
        kind="small/accent"
        color={matches ? 'var(--positive-500)' : 'var(--negative-500)'}
      >
        {matches ? '✓' : '✗ mismatch'}
      </UIText>
    </HStack>
  );
}

function Section({
  title,
  cases,
  format,
}: {
  title: string;
  cases: Case[];
  format: (value: number) => string;
}) {
  return (
    <VStack gap={12}>
      <UIText kind="headline/h3">{title}</UIText>
      <HStack
        gap={16}
        style={{
          gridTemplateColumns: '200px 120px 120px 1fr',
          display: 'grid',
        }}
      >
        <UIText kind="caption/accent" color="var(--neutral-500)">
          input
        </UIText>
        <UIText kind="caption/accent" color="var(--neutral-500)">
          formatted
        </UIText>
        <UIText kind="caption/accent" color="var(--neutral-500)">
          expected
        </UIText>
        <UIText kind="caption/accent" color="var(--neutral-500)">
          status
        </UIText>
      </HStack>
      {cases.map(([input, expected]) => (
        <CaseRow
          key={String(input)}
          input={input}
          expected={expected}
          actual={format(input)}
        />
      ))}
    </VStack>
  );
}

registerPreviewPermanent({
  name: 'Currency Formatters (USD PRD)',
  component: () => (
    <VStack gap={36}>
      <Section
        title="Style 1 — amount (formatCurrencyValue)"
        cases={AMOUNT_CASES}
        format={(value) => formatCurrencyValue(value, 'en', 'usd')}
      />
      <Section
        title="Style 2 — price (formatPriceValue)"
        cases={PRICE_CASES}
        format={(value) => formatPriceValue(value, 'en', 'usd')}
      />
    </VStack>
  ),
});
