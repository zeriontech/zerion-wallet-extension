import React from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { formatPercent } from 'src/shared/units/formatPercent';
import { formatPriceValue } from 'src/shared/units/formatPriceValue';
import type { PerpPosition } from 'src/modules/hyperliquid/api/requests/perp-clearinghouse-state.types';
import { getPerpDisplayName } from 'src/modules/hyperliquid/parsePerpId';
import { getPerpIconUrl } from 'src/modules/hyperliquid/getPerpIconUrl';
import { HStack } from 'src/ui/ui-kit/HStack';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { VStack } from 'src/ui/ui-kit/VStack';
import { BlurrableBalance } from 'src/ui/components/BlurrableBalance';
import styles from './PerpsPositionCard.module.css';

function StatColumn({
  label,
  value,
  align = 'start',
}: {
  label: string;
  value: React.ReactNode;
  align?: 'start' | 'end';
}) {
  return (
    <VStack
      gap={0}
      style={{ alignItems: align === 'end' ? 'flex-end' : 'flex-start' }}
    >
      <UIText kind="caption/regular" color="var(--neutral-600)">
        {label}
      </UIText>
      <UIText kind="small/accent">{value}</UIText>
    </VStack>
  );
}

export function PerpsPositionCard({
  position,
  markPx,
}: {
  position: PerpPosition;
  markPx: number | null;
}) {
  const { currency } = useCurrency();

  const displayName = getPerpDisplayName(position.coin);
  const szi = Number(position.szi);
  const isLong = szi >= 0;
  const entryPx = Number(position.entryPx);
  const marginUsed = Number(position.marginUsed);
  const unrealizedPnl = Number(position.unrealizedPnl);
  const roe = Number(position.returnOnEquity) * 100;
  const liquidationPx =
    position.liquidationPx != null ? Number(position.liquidationPx) : null;
  const isPositivePnl = unrealizedPnl >= 0;
  const leverageValue = position.leverage.value;

  return (
    <UnstyledLink
      to={`/perps/${encodeURIComponent(position.coin)}`}
      className={styles.card}
    >
      <VStack gap={12}>
        <HStack gap={12} alignItems="center">
          <HStack gap={8} alignItems="center" style={{ flex: 1, minWidth: 0 }}>
            <TokenIcon
              src={getPerpIconUrl(position.coin)}
              symbol={displayName}
              size={36}
              style={{ borderRadius: '50%' }}
            />
            <VStack gap={0} style={{ minWidth: 0 }}>
              <UIText
                kind="body/accent"
                style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {displayName}
              </UIText>
              <UIText
                kind="caption/accent"
                style={{
                  padding: '2px 4px',
                  borderRadius: 4,
                  width: 'max-content',
                  backgroundColor: isLong
                    ? 'var(--positive-200)'
                    : 'var(--negative-200)',
                  color: isLong ? 'var(--positive-500)' : 'var(--negative-500)',
                }}
              >
                {isLong ? 'Long' : 'Short'} · {leverageValue}x
              </UIText>
            </VStack>
          </HStack>
          <VStack gap={0} style={{ alignItems: 'flex-end', flexShrink: 0 }}>
            <UIText kind="small/accent">
              <BlurrableBalance kind="small/accent" color="var(--black)">
                {formatCurrencyValue(marginUsed, 'en', currency)}
              </BlurrableBalance>
            </UIText>
            <UIText
              kind="small/regular"
              color={
                isPositivePnl ? 'var(--positive-500)' : 'var(--negative-500)'
              }
              style={{ display: 'flex', gap: 4 }}
            >
              <span>
                {isPositivePnl ? '+' : '-'}
                {formatPercent(Math.abs(roe), 'en', {
                  maximumFractionDigits: 2,
                })}
                %
              </span>
              <BlurrableBalance
                kind="small/regular"
                color={
                  isPositivePnl ? 'var(--positive-500)' : 'var(--negative-500)'
                }
              >
                ({formatCurrencyValue(Math.abs(unrealizedPnl), 'en', currency)})
              </BlurrableBalance>
            </UIText>
          </VStack>
        </HStack>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 16,
          }}
        >
          <StatColumn
            label="Entry Price"
            value={formatPriceValue(entryPx, 'en', currency)}
          />
          <StatColumn
            label="Market Price"
            value={
              markPx != null ? formatPriceValue(markPx, 'en', currency) : '—'
            }
          />
          <StatColumn
            label="Liq. Price"
            value={
              liquidationPx != null
                ? formatPriceValue(liquidationPx, 'en', currency)
                : '—'
            }
            align="end"
          />
        </div>
      </VStack>
    </UnstyledLink>
  );
}
