import { useSelectorStore } from '@store-unit/react';
import type { SwapFormView } from '@zeriontech/transactions';
import BigNumber from 'bignumber.js';
import React from 'react';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { UIText } from 'src/ui/ui-kit/UIText';
import { isNumeric } from 'src/shared/isNumeric';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { PercentChange } from 'src/ui/components/PercentChange';
import { HStack } from 'src/ui/ui-kit/HStack';
import {
  getPriceImpactPercentage,
  isSignificantValueLoss,
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

  const fiatValue = new BigNumber(inputValue || 0).times(
    asset?.price?.value || 0
  );

  return (
    <HStack gap={4}>
      <UIText kind="small/regular" color={color} style={style} title={title}>
        {isPrimaryInput ? null : '≈'}
        {formatCurrencyValue(fiatValue, 'en', currency)}
      </UIText>
      {percentageChange}
    </HStack>
  );
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
  const isSignificantLoss = priceImpact
    ? isSignificantValueLoss(priceImpact)
    : false;

  const percentageValue = priceImpact
    ? getPriceImpactPercentage(priceImpact)
    : null;

  return (
    <FiatInputValue
      name="receiveInput"
      swapView={swapView}
      percentageChange={
        isSignificantLoss && percentageValue ? (
          <PercentChange
            value={percentageValue}
            locale="en"
            render={(change) => {
              return (
                <UIText kind="small/regular" color="var(--negative-500)">
                  {`(${change.formatted})`}
                </UIText>
              );
            }}
          />
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
