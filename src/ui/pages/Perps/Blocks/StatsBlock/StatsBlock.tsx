import React from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { formatPercent } from 'src/shared/units/formatPercent';
import { formatPriceValue } from 'src/shared/units/formatPriceValue';
import type { PerpAssetEntry } from 'src/modules/hyperliquid/findPerpAsset';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import * as styles from './styles.module.css';

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <HStack
      gap={4}
      alignItems="center"
      style={{
        backgroundColor: 'var(--neutral-100)',
        borderRadius: 8,
        padding: '8px',
        flexShrink: 0,
      }}
    >
      <UIText kind="caption/accent" color="var(--neutral-600)">
        {label}
      </UIText>
      <UIText kind="caption/accent">{value}</UIText>
    </HStack>
  );
}

export function StatsBlock({ asset }: { asset: PerpAssetEntry }) {
  const { currency } = useCurrency();

  const fundingRate = Number(asset.ctx.funding) * 100;
  const markPx = Number(asset.ctx.markPx);
  const openInterest = Number(asset.ctx.openInterest);
  const dayVolume = Number(asset.ctx.dayNtlVlm);
  const openInterestUsd = openInterest * markPx;

  return (
    <div className={styles.scrollContainer}>
      <HStack
        gap={8}
        style={{ width: 'max-content', gridAutoColumns: 'max-content' }}
      >
        <StatPill
          label="24h Volume"
          value={formatPriceValue(dayVolume, 'en', currency, {
            notation: 'compact',
          })}
        />
        <StatPill
          label="Open Interest"
          value={formatPriceValue(openInterestUsd, 'en', currency, {
            notation: 'compact',
          })}
        />
        <StatPill
          label="Funding"
          value={`${formatPercent(fundingRate, 'en', {
            maximumFractionDigits: 4,
          })}%`}
        />
      </HStack>
    </div>
  );
}

export function StatsBlockSkeleton() {
  return (
    <HStack gap={8}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 112,
            height: 28,
            borderRadius: 8,
            backgroundColor: 'var(--neutral-200)',
          }}
        />
      ))}
    </HStack>
  );
}
