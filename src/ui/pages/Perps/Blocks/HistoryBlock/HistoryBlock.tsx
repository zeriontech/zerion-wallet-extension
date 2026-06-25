import React, { useMemo, useState } from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { formatPriceValue } from 'src/shared/units/formatPriceValue';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import type { PerpFill } from 'src/modules/hyperliquid/api/requests/perp-user-fills.types';
import { classifyFill } from 'src/modules/hyperliquid/classifyFill';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { BlurrableBalance } from 'src/ui/components/BlurrableBalance';

const PAGE_SIZE = 50;

function relativeTime(time: number): string {
  const diff = Date.now() - time;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  if (diff < 2_592_000_000) return `${Math.floor(diff / 604_800_000)}w ago`;
  return `${Math.floor(diff / 2_592_000_000)}mo ago`;
}

function badgeColors(kind: ReturnType<typeof classifyFill>) {
  if (kind.isLiquidation) {
    return { bg: 'var(--negative-100)', fg: 'var(--negative-500)' };
  }
  if (kind.isOpen) {
    return { bg: 'var(--positive-100)', fg: 'var(--positive-500)' };
  }
  return { bg: 'var(--neutral-200)', fg: 'var(--neutral-700)' };
}

function FillRow({
  fill,
  displayName,
}: {
  fill: PerpFill;
  displayName: string;
}) {
  const { currency } = useCurrency();

  const px = Number(fill.px);
  const sz = Number(fill.sz);
  const closedPnl = Number(fill.closedPnl);
  const showPnl = closedPnl !== 0;
  const isPositivePnl = closedPnl >= 0;
  const kind = classifyFill(fill);
  const badge = badgeColors(kind);

  return (
    <HStack
      gap={8}
      justifyContent="space-between"
      alignItems="center"
      style={{
        padding: '12px 0',
        borderBottom: '1px solid var(--neutral-200)',
      }}
    >
      <HStack gap={8} alignItems="center" style={{ minWidth: 0 }}>
        <UIText
          kind="caption/accent"
          style={{
            padding: '2px 8px',
            borderRadius: 4,
            backgroundColor: badge.bg,
            color: badge.fg,
          }}
        >
          {kind.label}
        </UIText>
        <UIText
          kind="small/regular"
          style={{
            display: 'flex',
            gap: 4,
            alignItems: 'center',
            minWidth: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <BlurrableBalance kind="small/regular" color="var(--black)">
            {formatTokenValue(sz, displayName)}
          </BlurrableBalance>
          <span style={{ color: 'var(--neutral-600)' }}>@</span>
          <span>{formatPriceValue(px, 'en', currency)}</span>
        </UIText>
      </HStack>
      <VStack gap={0} style={{ textAlign: 'end', flexShrink: 0 }}>
        {showPnl ? (
          <UIText
            kind="caption/accent"
            color={
              isPositivePnl ? 'var(--positive-500)' : 'var(--negative-500)'
            }
          >
            <BlurrableBalance
              kind="caption/accent"
              color={
                isPositivePnl ? 'var(--positive-500)' : 'var(--negative-500)'
              }
            >
              {formatCurrencyValue(closedPnl, 'en', currency)}
            </BlurrableBalance>
          </UIText>
        ) : null}
        <UIText kind="caption/regular" color="var(--neutral-600)">
          {relativeTime(fill.time)}
        </UIText>
      </VStack>
    </HStack>
  );
}

export function HistoryBlock({
  fills,
  displayName,
}: {
  fills: PerpFill[];
  displayName: string;
}) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const sorted = useMemo(
    () => [...fills].sort((a, b) => b.time - a.time),
    [fills]
  );
  const slice = sorted.slice(0, visible);
  const hasMore = visible < sorted.length;

  if (sorted.length === 0) {
    return null;
  }

  return (
    <VStack gap={12}>
      <UIText kind="body/accent">History</UIText>
      <VStack gap={0}>
        {slice.map((fill) => (
          <FillRow
            key={`${fill.hash}-${fill.tid}`}
            fill={fill}
            displayName={displayName}
          />
        ))}
      </VStack>
      {hasMore ? (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            kind="regular"
            size={40}
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
          >
            Show more
          </Button>
        </div>
      ) : null}
    </VStack>
  );
}

export function HistoryBlockSkeleton() {
  return (
    <VStack gap={12}>
      <div
        style={{
          height: 20,
          width: 64,
          borderRadius: 4,
          backgroundColor: 'var(--neutral-200)',
        }}
      />
      <VStack gap={0}>
        {[0, 1, 2, 3, 4].map((i) => (
          <HStack
            key={i}
            gap={8}
            justifyContent="space-between"
            alignItems="center"
            style={{
              padding: '12px 0',
              borderBottom: '1px solid var(--neutral-200)',
            }}
          >
            <HStack gap={8} alignItems="center" style={{ minWidth: 0 }}>
              <div
                style={{
                  height: 20,
                  width: 80,
                  borderRadius: 4,
                  backgroundColor: 'var(--neutral-200)',
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  height: 16,
                  width: 180,
                  borderRadius: 4,
                  backgroundColor: 'var(--neutral-200)',
                }}
              />
            </HStack>
            <VStack gap={2} style={{ alignItems: 'flex-end', flexShrink: 0 }}>
              <div
                style={{
                  height: 16,
                  width: 64,
                  borderRadius: 4,
                  backgroundColor: 'var(--neutral-200)',
                }}
              />
              <div
                style={{
                  height: 12,
                  width: 48,
                  borderRadius: 4,
                  backgroundColor: 'var(--neutral-200)',
                }}
              />
            </VStack>
          </HStack>
        ))}
      </VStack>
    </VStack>
  );
}
