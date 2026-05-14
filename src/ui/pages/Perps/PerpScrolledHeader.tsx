import React from 'react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { getPerpIconUrl } from 'src/modules/hyperliquid/getPerpIconUrl';
import type { PerpAssetEntry } from 'src/modules/hyperliquid/findPerpAsset';
import { formatPriceValue } from 'src/shared/units/formatPriceValue';
import { HStack } from 'src/ui/ui-kit/HStack';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { UIText } from 'src/ui/ui-kit/UIText';
import { emDash } from 'src/ui/shared/typography';

export function PerpScrolledHeader({
  coin,
  displayName,
  asset,
  className,
}: {
  coin: string;
  displayName: string;
  asset: PerpAssetEntry | null;
  className?: string;
}) {
  const { currency } = useCurrency();
  const markPx = asset ? Number(asset.ctx.markPx) : null;

  return (
    <HStack
      gap={8}
      alignItems="center"
      justifyContent="center"
      className={className}
    >
      <TokenIcon
        src={getPerpIconUrl(coin)}
        symbol={displayName}
        size={20}
        style={{ borderRadius: 5 }}
      />
      <UIText kind="body/accent" style={{ display: 'flex', gap: 4 }}>
        <span>{displayName}</span>
        {markPx != null ? (
          <>
            <span>{emDash}</span>
            <span>{formatPriceValue(markPx, 'en', currency)}</span>
          </>
        ) : null}
      </UIText>
    </HStack>
  );
}
