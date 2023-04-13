import React from 'react';
import type { Asset } from 'defi-sdk';
import type { Chain } from 'src/modules/networks/Chain';
import { getDecimals } from 'src/modules/networks/asset';
import { baseToCommon } from 'src/shared/units/convert';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { Media } from 'src/ui/ui-kit/Media';
import { Image } from 'src/ui/ui-kit/MediaFallback';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnknownIcon } from '../../UnknownIcon';
import { ItemSurface } from '../../ItemSurface';

export function AmountLine({
  asset,
  amount,
  chain,
}: {
  asset: Asset;
  amount: string;
  chain: Chain;
}) {
  return (
    <ItemSurface>
      <Media
        vGap={0}
        image={
          <Image
            style={{ width: 32, height: 32, borderRadius: '50%' }}
            renderError={() => <UnknownIcon size={32} />}
            src={asset.icon_url || ''}
          />
        }
        text={
          <UIText kind="caption/regular" color="var(--neutral-500)">
            Amount
          </UIText>
        }
        detailText={
          <UIText kind="body/regular">
            {`${formatTokenValue(
              baseToCommon(amount, getDecimals({ asset, chain }))
            )} ${asset.symbol}`}
          </UIText>
        }
      />
    </ItemSurface>
  );
}
