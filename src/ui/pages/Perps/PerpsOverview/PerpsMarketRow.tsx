import React from 'react';
import type { Perp } from 'src/modules/zerion-api/requests/search-query';
import { getPerpIconUrl } from 'src/modules/hyperliquid/getPerpIconUrl';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { formatPriceValue } from 'src/shared/units/formatPriceValue';
import { formatPercent } from 'src/shared/units/formatPercent';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import styles from './PerpsMarketRow.module.css';

// Row layout deliberately duplicates Search.tsx's private `PerpView`, minus the
// "PERP" badge — the Markets list and Search share a visual but not a code path
// (Search's row carries combobox-only concerns). See ADR-0002 / CONTEXT.md.
export function PerpsMarketRow({ perp }: { perp: Perp }) {
  const { currency } = useCurrency();
  const { relativeChange1d, price, maxLeverage, volume24h } = perp.meta;
  const changeColor =
    relativeChange1d == null
      ? 'var(--neutral-500)'
      : relativeChange1d >= 0
      ? 'var(--positive-500)'
      : 'var(--negative-500)';
  const changePrefix =
    relativeChange1d != null && relativeChange1d > 0 ? '+' : '';
  // iOS subtitle: "{24h volume, compact} · {leverage}x", e.g. "$2.5M · 10x".
  const volumeLabel =
    volume24h != null
      ? formatPriceValue(volume24h, 'en', currency, { notation: 'compact' })
      : null;
  const subtitle = [volumeLabel, `${maxLeverage}×`].filter(Boolean).join(' · ');

  return (
    <UnstyledLink
      to={`/perps/${encodeURIComponent(perp.name)}`}
      className={styles.row}
    >
      <HStack
        gap={8}
        alignItems="center"
        style={{ gridTemplateColumns: 'auto 1fr' }}
      >
        <TokenIcon
          src={perp.iconUrl || getPerpIconUrl(perp.id)}
          symbol={perp.symbol}
          size={36}
          title={perp.name}
          style={{ borderRadius: '50%' }}
        />
        <VStack gap={0} style={{ overflow: 'hidden' }}>
          <HStack
            gap={4}
            alignItems="center"
            justifyContent="space-between"
            style={{ gridTemplateColumns: '1fr auto' }}
          >
            <UIText
              kind="body/accent"
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={perp.name}
            >
              {perp.symbol}
            </UIText>
            {price != null ? (
              <UIText kind="body/accent">
                {formatPriceValue(price, 'en', currency)}
              </UIText>
            ) : null}
          </HStack>
          <HStack gap={4} alignItems="center" justifyContent="space-between">
            <UIText kind="small/regular" color="var(--neutral-500)">
              {subtitle}
            </UIText>
            {relativeChange1d != null ? (
              <UIText kind="small/regular" color={changeColor}>
                {changePrefix}
                {formatPercent(relativeChange1d, 'en')}%
              </UIText>
            ) : null}
          </HStack>
        </VStack>
      </HStack>
    </UnstyledLink>
  );
}
