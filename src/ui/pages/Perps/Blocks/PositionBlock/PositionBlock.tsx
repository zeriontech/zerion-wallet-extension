import React from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { formatPercent } from 'src/shared/units/formatPercent';
import { formatPriceValue } from 'src/shared/units/formatPriceValue';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import type { PerpPosition } from 'src/modules/hyperliquid/api/requests/perp-clearinghouse-state.types';
import { Frame } from 'src/ui/ui-kit/Frame';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <HStack
      gap={8}
      justifyContent="space-between"
      style={{
        padding: '12px 0',
        borderBottom: '1px solid var(--neutral-200)',
      }}
    >
      <UIText kind="caption/regular" color="var(--neutral-600)">
        {label}
      </UIText>
      <UIText kind="body/accent">{value}</UIText>
    </HStack>
  );
}

function GridCell({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: React.ReactNode;
  valueColor?: string;
}) {
  return (
    <VStack gap={4}>
      <UIText kind="caption/regular" color="var(--neutral-600)">
        {label}
      </UIText>
      <UIText kind="body/accent" color={valueColor}>
        {value}
      </UIText>
    </VStack>
  );
}

export function PositionBlock({
  position,
  displayName,
}: {
  position: PerpPosition;
  displayName: string;
}) {
  const { currency } = useCurrency();

  const szi = Number(position.szi);
  const isLong = szi >= 0;
  const size = Math.abs(szi);
  const entryPx = Number(position.entryPx);
  const positionValue = Number(position.positionValue);
  const marginUsed = Number(position.marginUsed);
  const unrealizedPnl = Number(position.unrealizedPnl);
  const roe = Number(position.returnOnEquity) * 100;
  const liquidationPx =
    position.liquidationPx != null ? Number(position.liquidationPx) : null;
  const fundingSinceOpen = Number(position.cumFunding.sinceOpen);
  const isPositivePnl = unrealizedPnl >= 0;
  const isPositiveFunding = fundingSinceOpen >= 0;
  const leverageValue = position.leverage.value;

  const pnlColor = isPositivePnl
    ? 'var(--positive-500)'
    : 'var(--negative-500)';

  return (
    <VStack gap={12}>
      <Frame>
        <VStack gap={16} style={{ padding: '16px' }}>
          <VStack gap={4}>
            <UIText kind="caption/regular" color="var(--neutral-600)">
              Position
            </UIText>
            <HStack gap={12} alignItems="center">
              <UIText kind="headline/h2">
                {formatCurrencyValue(marginUsed, 'en', currency)}
              </UIText>
              <UIText
                kind="caption/accent"
                style={{
                  padding: '2px 8px',
                  borderRadius: 6,
                  position: 'relative',
                  top: 1,
                  backgroundColor: isLong
                    ? 'var(--positive-200)'
                    : 'var(--negative-200)',
                  color: isLong ? 'var(--positive-500)' : 'var(--negative-500)',
                }}
              >
                {isLong ? 'Long' : 'Short'} · {leverageValue}x
              </UIText>
            </HStack>
          </VStack>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
            }}
          >
            <GridCell
              label="PnL"
              valueColor={pnlColor}
              value={
                <>
                  {isPositivePnl ? '+' : '-'}
                  {formatPercent(Math.abs(roe), 'en', {
                    maximumFractionDigits: 2,
                  })}
                  % (
                  {formatCurrencyValue(Math.abs(unrealizedPnl), 'en', currency)}
                  )
                </>
              }
            />
            <GridCell
              label="Notional"
              value={formatCurrencyValue(positionValue, 'en', currency)}
            />
          </div>
        </VStack>
      </Frame>
      <VStack gap={0} style={{ paddingInline: 16 }}>
        <DetailRow label="Size" value={formatTokenValue(size, displayName)} />
        <DetailRow
          label="Entry Price"
          value={formatPriceValue(entryPx, 'en', currency)}
        />
        <DetailRow
          label="Liquidation Price"
          value={
            liquidationPx != null
              ? formatPriceValue(liquidationPx, 'en', currency)
              : '—'
          }
        />
        <DetailRow
          label="Funding Payments"
          value={
            <>
              {isPositiveFunding ? '' : '-'}
              {formatCurrencyValue(Math.abs(fundingSinceOpen), 'en', currency)}
            </>
          }
        />
      </VStack>
    </VStack>
  );
}

export function PositionBlockSkeleton() {
  return (
    <VStack gap={12}>
      <Frame>
        <VStack gap={16} style={{ padding: 16 }}>
          <VStack gap={4}>
            <div
              style={{
                height: 14,
                width: 64,
                borderRadius: 4,
                backgroundColor: 'var(--neutral-200)',
              }}
            />
            <HStack gap={8} alignItems="center">
              <div
                style={{
                  height: 28,
                  width: 128,
                  borderRadius: 4,
                  backgroundColor: 'var(--neutral-200)',
                }}
              />
              <div
                style={{
                  height: 20,
                  width: 112,
                  borderRadius: 4,
                  backgroundColor: 'var(--neutral-200)',
                }}
              />
            </HStack>
          </VStack>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
            }}
          >
            {[0, 1].map((i) => (
              <VStack gap={4} key={i}>
                <div
                  style={{
                    height: 14,
                    width: 64,
                    borderRadius: 4,
                    backgroundColor: 'var(--neutral-200)',
                  }}
                />
                <div
                  style={{
                    height: 20,
                    width: 96,
                    borderRadius: 4,
                    backgroundColor: 'var(--neutral-200)',
                  }}
                />
              </VStack>
            ))}
          </div>
        </VStack>
      </Frame>
      <VStack gap={0} style={{ paddingInline: 16 }}>
        {[0, 1, 2, 3].map((i) => (
          <HStack
            key={i}
            gap={8}
            justifyContent="space-between"
            style={{
              padding: '12px 0',
              borderBottom: '1px solid var(--neutral-200)',
            }}
          >
            <div
              style={{
                height: 14,
                width: 96,
                borderRadius: 4,
                backgroundColor: 'var(--neutral-200)',
              }}
            />
            <div
              style={{
                height: 14,
                width: 80,
                borderRadius: 4,
                backgroundColor: 'var(--neutral-200)',
              }}
            />
          </HStack>
        ))}
      </VStack>
    </VStack>
  );
}
