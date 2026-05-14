import React from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { formatPercent } from 'src/shared/units/formatPercent';
import { formatPriceValue } from 'src/shared/units/formatPriceValue';
import { minus } from 'src/ui/shared/typography';
import type { PerpAssetEntry } from 'src/modules/hyperliquid/findPerpAsset';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';

function getChangeColor(value: number) {
  if (value === 0) return 'var(--black)';
  return value > 0 ? 'var(--positive-500)' : 'var(--negative-500)';
}

function getChangeSign(value: number) {
  if (value === 0) return '';
  return value > 0 ? '+' : minus;
}

export function Heading({ asset }: { asset: PerpAssetEntry }) {
  const { currency } = useCurrency();
  const markPx = Number(asset.ctx.markPx);
  const prevDayPx = Number(asset.ctx.prevDayPx);
  const change =
    prevDayPx > 0 ? ((markPx - prevDayPx) / prevDayPx) * 100 : null;

  return (
    <HStack gap={8} alignItems="end">
      <UIText kind="headline/h1">
        {formatPriceValue(markPx, 'en', currency)}
      </UIText>
      {change != null ? (
        <UIText
          kind="body/accent"
          style={{ marginBottom: 4, color: getChangeColor(change) }}
        >
          {getChangeSign(change)}
          {formatPercent(Math.abs(change), 'en', { maximumFractionDigits: 2 })}%
        </UIText>
      ) : null}
    </HStack>
  );
}

export function HeadingSkeleton() {
  return (
    <HStack gap={8} alignItems="end">
      <div
        style={{
          width: 192,
          height: 40,
          borderRadius: 4,
          backgroundColor: 'var(--neutral-200)',
        }}
      />
      <div
        style={{
          width: 56,
          height: 20,
          borderRadius: 4,
          backgroundColor: 'var(--neutral-200)',
          marginBottom: 4,
        }}
      />
    </HStack>
  );
}
