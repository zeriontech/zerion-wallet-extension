import BigNumber from 'bignumber.js';
import React, { useMemo } from 'react';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { UIText } from 'src/ui/ui-kit/UIText';
import { isNumeric } from 'src/shared/isNumeric';
import { useCurrency } from 'src/modules/currency/useCurrency';
import type { Asset } from 'defi-sdk';
import { HStack } from 'src/ui/ui-kit/HStack';
import type { PriceImpact } from 'src/ui/pages/SwapForm/shared/price-impact';
import { getPriceImpactPercentage } from 'src/ui/pages/SwapForm/shared/price-impact';
import { formatPercent } from 'src/shared/units/formatPercent';

export function FiatInputValue({
  name,
  primaryInput,
  spendInput,
  spendAsset,
  receiveInput,
  receiveAsset,
  percentageChange,
  color,
  style,
  title,
}: {
  name: 'spendInput' | 'receiveInput';
  primaryInput?: 'spend' | 'receive';
  spendInput?: string;
  spendAsset: Asset | null;
  receiveInput?: string;
  receiveAsset: Asset | null;
  percentageChange: React.ReactNode | null;
  color?: string;
  style?: React.CSSProperties;
  title?: string;
}) {
  const { currency } = useCurrency();

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

interface FieldInputValueProps {
  primaryInput?: 'spend' | 'receive';
  spendInput?: string;
  spendAsset: Asset | null;
  receiveInput?: string;
  receiveAsset: Asset | null;
}

export function SpendFiatInputValue(props: FieldInputValueProps) {
  return (
    <FiatInputValue
      {...props}
      name="spendInput"
      percentageChange={null}
      color="var(--neutral-600)"
    />
  );
}

export function ReceiveFiatInputValue({
  priceImpact,
  ...props
}: {
  priceImpact: PriceImpact | null;
} & FieldInputValueProps) {
  const isSignificantLoss =
    priceImpact?.kind === 'loss' &&
    (priceImpact.level === 'medium' || priceImpact.level === 'high');

  const priceImpactPercentage = priceImpact
    ? getPriceImpactPercentage(priceImpact)
    : null;

  const percentageChange = useMemo(
    () =>
      priceImpactPercentage
        ? `${formatPercent(priceImpactPercentage, 'en')}%`
        : null,
    [priceImpactPercentage]
  );

  const showPercentageChange =
    Boolean(percentageChange) &&
    (priceImpact?.kind === 'zero' || priceImpact?.kind === 'loss');

  return (
    <FiatInputValue
      {...props}
      name="receiveInput"
      percentageChange={
        showPercentageChange && percentageChange ? (
          <UIText
            kind="small/regular"
            color={
              isSignificantLoss ? 'var(--negative-500)' : 'var(--neutral-600)'
            }
          >
            {`(${percentageChange})`}
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
