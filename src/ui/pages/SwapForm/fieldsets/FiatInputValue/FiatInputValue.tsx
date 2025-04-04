import { useSelectorStore } from '@store-unit/react';
import type { SwapFormView } from '@zeriontech/transactions';
import BigNumber from 'bignumber.js';
import React, { useMemo } from 'react';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { UIText } from 'src/ui/ui-kit/UIText';
import { isNumeric } from 'src/shared/isNumeric';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { HStack } from 'src/ui/ui-kit/HStack';
import { formatPercentChange } from 'src/shared/units/formatPercent/formatPercentChange';
import {
  getPriceImpactPercentage,
  type PriceImpact,
} from '../../shared/price-impact';

interface FiatInputValueProps {
  name: 'spendInput' | 'receiveInput';
  swapView: SwapFormView;
  percentageChange: React.ReactNode | null;
  color?: string;
  style?: React.CSSProperties;
  title?: string;
}

export function FiatInputValue({
  name,
  swapView,
  percentageChange,
  color,
  style,
  title,
}: FiatInputValueProps) {
  const { currency } = useCurrency();
  const { receiveAsset, spendAsset } = swapView;
  const { primaryInput, spendInput, receiveInput } = useSelectorStore(
    swapView.store,
    ['primaryInput', 'receiveInput', 'spendInput']
  );

  const asset = name === 'receiveInput' ? receiveAsset : spendAsset;
  const inputValue = name === 'receiveInput' ? receiveInput : spendInput;

  const isPrimaryInput =
    name === 'receiveInput'
      ? primaryInput === 'receive'
      : primaryInput === 'spend';

  if (inputValue == null || !isNumeric(inputValue)) {
    return null;
  }

  const assetPrice = asset?.price?.value;
  const fiatValue = assetPrice
    ? new BigNumber(inputValue || 0).times(assetPrice)
    : null;

  return fiatValue ? (
    <HStack gap={4}>
      <UIText kind="small/regular" color={color} style={style} title={title}>
        {isPrimaryInput ? null : '≈'}
        {formatCurrencyValue(fiatValue, 'en', currency)}
      </UIText>
      {percentageChange}
    </HStack>
  ) : null;
}

export function SpendFiatInputValue({ swapView }: { swapView: SwapFormView }) {
  return (
    <FiatInputValue
      name="spendInput"
      swapView={swapView}
      percentageChange={null}
      color="var(--neutral-600)"
    />
  );
}

export function ReceiveFiatInputValue({
  swapView,
  priceImpact,
}: {
  swapView: SwapFormView;
  priceImpact: PriceImpact | null;
}) {
  const isSignificantLoss =
    priceImpact?.kind === 'loss' &&
    (priceImpact.level === 'medium' || priceImpact.level === 'high');

  const priceImpactPercentage = priceImpact
    ? getPriceImpactPercentage(priceImpact)
    : null;

  const percentageChange = useMemo(
    () =>
      priceImpactPercentage
        ? formatPercentChange(priceImpactPercentage, 'en')
        : null,
    [priceImpactPercentage]
  );

  const showPercentageChange =
    Boolean(percentageChange) &&
    (priceImpact?.kind === 'zero' || priceImpact?.kind === 'loss');

  return (
    <FiatInputValue
      name="receiveInput"
      swapView={swapView}
      percentageChange={
        showPercentageChange ? (
          <UIText
            kind="small/regular"
            color={
              isSignificantLoss ? 'var(--negative-500)' : 'var(--neutral-600)'
            }
          >
            {`(${percentageChange?.formatted})`}
          </UIText>
        ) : null
      }
      color={isSignificantLoss ? 'var(--negative-500)' : 'var(--neutral-600)'}
      style={isSignificantLoss ? { cursor: 'help' } : undefined}
      title={
        isSignificantLoss
          ? 'The exchange rate is lower than the market rate. Lack of liquidity affects the exchange rate. Try a lower amount.'
          : undefined
      }
    />
  );
}
