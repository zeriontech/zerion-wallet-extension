import React from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import type { Asset } from 'src/modules/zerion-api/requests/asset-get-fungible-full-info';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { formatPercent } from 'src/shared/units/formatPercent/formatPercent';
import { HStack } from 'src/ui/ui-kit/HStack';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import VerifiedIcon from 'jsx:src/ui/assets/verified.svg';
import { minus } from 'src/ui/shared/typography';

export function AssetTitleAndChart({ asset }: { asset: Asset }) {
  const { currency } = useCurrency();
  return (
    <VStack gap={12}>
      <HStack gap={8} alignItems="center">
        <div style={{ position: 'relative' }}>
          <TokenIcon
            src={asset.iconUrl}
            symbol={asset.symbol}
            size={40}
            title={asset.name}
          />
          {asset.new ? (
            <UIText
              kind="caption/accent"
              color="var(--white)"
              style={{
                position: 'absolute',
                top: 32,
                left: 4,
                background: 'var(--black)',
                borderRadius: 6,
                padding: '2px 4px',
              }}
            >
              new
            </UIText>
          ) : null}
        </div>
        <VStack gap={0}>
          <UIText kind="caption/regular" color="var(--neutral-500)">
            {asset.symbol}
          </UIText>
          <HStack gap={4} alignItems="center">
            <UIText kind="headline/h3" style={{ display: 'flex' }}>
              {asset.name}
            </UIText>
            {asset.verified ? <VerifiedIcon /> : null}
          </HStack>
        </VStack>
      </HStack>
      <HStack gap={8} alignItems="end">
        <UIText kind="headline/hero">
          {formatCurrencyValue(asset.meta.price || 0, 'en', currency)}
        </UIText>
        <UIText
          kind="body/accent"
          color={
            asset.meta.relativeChange1d > 0
              ? 'var(--positive-500)'
              : asset.meta.relativeChange1d < 0
              ? 'var(--negative-500)'
              : 'var(--neutral-500)'
          }
          style={{ paddingBottom: 4 }}
        >
          {asset.meta.relativeChange1d > 0
            ? '+'
            : asset.meta.relativeChange1d < 0
            ? minus
            : ''}
          {formatPercent(Math.abs(asset.meta.relativeChange1d * 100), 'en')}%
        </UIText>
      </HStack>
    </VStack>
  );
}
