import React from 'react';
import { getPerpIconUrl } from 'src/modules/hyperliquid/getPerpIconUrl';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { formatPriceValue } from 'src/shared/units/formatPriceValue';
import { HStack } from 'src/ui/ui-kit/HStack';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import type { TradeMode, TradeSide } from './useTradeFormState';

function getTradeTitle(
  mode: TradeMode | null,
  side: TradeSide,
  positionIsLong: boolean | null
): string {
  const effectiveMode = mode ?? 'open';
  if (effectiveMode === 'open') {
    return side === 'short' ? 'Open Short' : 'Open Long';
  }
  if (effectiveMode === 'add') {
    return positionIsLong === false ? 'Add to Short' : 'Add to Long';
  }
  return 'Close Position';
}

export function TradeNavTitle({
  coin,
  displayName,
  mode,
  side,
  positionIsLong,
  markPrice,
}: {
  coin: string;
  displayName: string;
  mode: TradeMode | null;
  side: TradeSide;
  positionIsLong: boolean | null;
  markPrice: number;
}) {
  const { currency } = useCurrency();
  const title = getTradeTitle(mode, side, positionIsLong);

  return (
    <VStack gap={0} style={{ justifyItems: 'center' }}>
      <HStack gap={4} alignItems="center">
        <UIText kind="body/accent">{title}</UIText>
        <TokenIcon
          src={getPerpIconUrl(coin)}
          symbol={displayName}
          size={16}
          style={{ borderRadius: 4 }}
        />
        <UIText kind="body/accent">{displayName}</UIText>
      </HStack>
      <UIText kind="small/accent" color="var(--neutral-600)">
        Price{' '}
        {markPrice > 0 ? formatPriceValue(markPrice, 'en', currency) : '—'}
      </UIText>
    </VStack>
  );
}
