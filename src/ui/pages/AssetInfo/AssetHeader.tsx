import React from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import type { Asset } from 'src/modules/zerion-api/requests/asset-get-fungible-full-info';
import { formatPriceValue } from 'src/shared/units/formatPriceValue';
import { HStack } from 'src/ui/ui-kit/HStack';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { UIText } from 'src/ui/ui-kit/UIText';
import { emDash } from 'src/ui/shared/typography';
import { VStack } from 'src/ui/ui-kit/VStack';
import VerifiedIcon from 'jsx:src/ui/assets/verified.svg';

export function AssetHeader({
  asset,
  className,
}: {
  asset: Asset;
  className?: string;
}) {
  const { currency } = useCurrency();
  const isUntrackedAsset = asset.meta.price == null;

  return (
    <HStack
      gap={8}
      alignItems="center"
      justifyContent="center"
      className={className}
    >
      <TokenIcon
        src={asset.iconUrl}
        symbol={asset.symbol}
        size={20}
        title={asset.name}
      />
      <UIText kind="body/accent">
        {asset.symbol}
        {isUntrackedAsset
          ? null
          : ` ${emDash} ${formatPriceValue(
              asset.meta.price || 0,
              'en',
              currency
            )}`}
      </UIText>
    </HStack>
  );
}

export function AssetDefaultHeader({
  asset,
  className,
}: {
  asset: Asset;
  className?: string;
}) {
  return (
    <HStack gap={8} className={className}>
      <TokenIcon
        src={asset.iconUrl}
        symbol={asset.symbol}
        size={40}
        title={asset.name}
      />
      <VStack gap={0}>
        <UIText kind="caption/regular" color="var(--neutral-500)">
          {asset.symbol}
        </UIText>
        <HStack
          gap={4}
          alignItems="center"
          style={{ gridTemplateColumns: 'minmax(0, 1fr) auto' }}
        >
          <UIText
            kind="headline/h3"
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {asset.name}
          </UIText>
          {asset.verified ? <VerifiedIcon /> : null}
        </HStack>
      </VStack>
    </HStack>
  );
}
