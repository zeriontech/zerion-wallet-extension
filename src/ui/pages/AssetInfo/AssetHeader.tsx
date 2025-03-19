import React from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import type { Asset } from 'src/modules/zerion-api/requests/asset-get-fungible-full-info';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { emDash } from 'src/ui/shared/typography';
import { HStack } from 'src/ui/ui-kit/HStack';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { UIText } from 'src/ui/ui-kit/UIText';

export function AssetHeader({
  asset,
  className,
}: {
  asset: Asset;
  className?: string;
}) {
  const { currency } = useCurrency();
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
        {asset.meta.price != null
          ? ` ${emDash} ${formatCurrencyValue(
              asset.meta.price || 0,
              'en',
              currency
            )}`
          : null}
      </UIText>
    </HStack>
  );
}
