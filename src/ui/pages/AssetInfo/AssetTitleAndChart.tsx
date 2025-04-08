import React from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import type { Asset } from 'src/modules/zerion-api/requests/asset-get-fungible-full-info';
import { formatPercent } from 'src/shared/units/formatPercent/formatPercent';
import { HStack } from 'src/ui/ui-kit/HStack';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import VerifiedIcon from 'jsx:src/ui/assets/verified.svg';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { formatPriceValue } from 'src/shared/units/formatPriceValue';
import { getColor, getSign } from './helpers';

const REQUEST_TOKEN_LINK = 'https://zerion.io/request-token';

export function AssetTitleAndChart({ asset }: { asset: Asset }) {
  const { currency } = useCurrency();
  const isUntrackedAsset = asset.meta.price == null;

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
      {isUntrackedAsset ? (
        <VStack gap={0}>
          <UIText kind="headline/hero">Price Not Tracked</UIText>
          <UIText kind="body/regular">
            <TextAnchor
              href={REQUEST_TOKEN_LINK}
              rel="noopener noreferrer"
              target="_blank"
              style={{ color: 'var(--primary)', cursor: 'pointer' }}
            >
              Let us know
            </TextAnchor>{' '}
            if you’d like to see it on Zerion
          </UIText>
        </VStack>
      ) : (
        <HStack gap={8} alignItems="end">
          <UIText kind="headline/hero">
            {formatPriceValue(asset.meta.price ?? 0, 'en', currency)}
          </UIText>
          {asset.meta.relativeChange1d != null ? (
            <UIText
              kind="body/accent"
              color={getColor(asset.meta.relativeChange1d)}
              style={{ paddingBottom: 4 }}
            >
              {getSign(asset.meta.relativeChange1d)}
              {formatPercent(Math.abs(asset.meta.relativeChange1d * 100), 'en')}
              %
            </UIText>
          ) : null}
        </HStack>
      )}
    </VStack>
  );
}
