import React, { useMemo } from 'react';
import { baseToCommon } from 'src/shared/units/convert';
import { getDecimals } from 'src/modules/networks/asset';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import type { Asset } from 'defi-sdk';
import type { Chain } from 'src/modules/networks/Chain';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { Media } from 'src/ui/ui-kit/Media';

export function PayWithLine({
  asset,
  value,
  chain,
}: {
  asset: Asset;
  value: string;
  chain: Chain;
}) {
  const commonQuantity = useMemo(
    () => baseToCommon(value, getDecimals({ chain, asset })),
    [asset, chain, value]
  );
  const fiatValue =
    asset.price?.value != null ? commonQuantity.times(asset.price.value) : null;
  return (
    <SurfaceList
      items={[
        {
          key: 0,
          target: '_blank',
          rel: 'noopener noreferrer',
          component: (
            <VStack gap={4}>
              <UIText kind="caption/regular" color="var(--neutral-500)">
                Send
              </UIText>

              <Media
                vGap={0}
                image={
                  <img
                    style={{ width: 32, height: 32, borderRadius: '50%' }}
                    src={asset.icon_url || ''}
                  />
                }
                text={
                  <UIText kind="headline/h3">
                    {formatTokenValue(commonQuantity, asset.symbol)}
                  </UIText>
                }
                detailText={
                  fiatValue ? (
                    <UIText kind="caption/regular" color="var(--neutral-500)">
                      {`≈ ${formatCurrencyValue(fiatValue, 'en', 'usd')}`}
                    </UIText>
                  ) : null
                }
              />
            </VStack>
          ),
        },
      ]}
    />
  );
}
