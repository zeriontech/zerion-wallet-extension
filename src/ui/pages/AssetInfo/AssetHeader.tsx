import React from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import type { Asset } from 'src/modules/zerion-api/requests/asset-get-fungible-full-info';
import { formatPriceValue } from 'src/shared/units/formatPriceValue';
import VerifiedIcon from 'jsx:src/ui/assets/verified.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

export function AssetHeader({ asset }: { asset: Asset }) {
  const { currency } = useCurrency();
  const priceElementRef = React.useRef<HTMLDivElement>(null);

  return (
    <HStack
      gap={8}
      alignItems="center"
      style={{ paddingLeft: 8, position: 'relative' }}
    >
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
      <VStack gap={0} style={{ justifyItems: 'start' }}>
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
      <UIText
        kind="headline/hero"
        ref={priceElementRef}
        color="var(--black)"
        style={{ position: 'absolute', top: 56, left: -28 }}
      >
        {formatPriceValue(asset.meta.price || 0, 'en', currency)}
      </UIText>
    </HStack>
  );
}
