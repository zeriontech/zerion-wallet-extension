import { useSelectorStore } from '@store-unit/react';
import type { SwapFormView } from '@zeriontech/transactions';
import BigNumber from 'bignumber.js';
import React from 'react';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { UIText } from 'src/ui/ui-kit/UIText';
import { isNumeric } from 'src/shared/isNumeric';
import { useCurrency } from 'src/modules/currency/useCurrency';
import type { PriceImpact } from '../../shared/price-impact';

interface FiatInputValueProps {
  name: 'spendInput' | 'receiveInput';
  swapView: SwapFormView;
  percentageChangeText: React.ReactNode | null;
  color?: string;
  style?: React.CSSProperties;
  title?: string;
}

export function FiatInputValue({
  name,
  swapView,
  percentageChangeText,
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
    <UIText kind="small/regular" color={color} style={style} title={title}>
      {isPrimaryInput ? null : '≈'}
      {formatCurrencyValue(fiatValue, 'en', currency)} {percentageChangeText}
    </UIText>
  );
}

export function SpendFiatInputValue({ swapView }: { swapView: SwapFormView }) {
  return (
    <FiatInputValue
      name="spendInput"
      swapView={swapView}
      percentageChangeText={null}
      color="var(--neutral-600)"
    />
  );
}

function isSignificantPriceImpact(priceImpact: PriceImpact | null) {
  return (
    priceImpact?.kind === 'loss' &&
    (priceImpact.level === 'medium' || priceImpact.level === 'high')
  );
}

export function ReceiveFiatInputValue({
  swapView,
  priceImpact,
}: {
  swapView: SwapFormView;
  priceImpact: PriceImpact | null;
}) {
  const isPriceImpactWarning = isSignificantPriceImpact(priceImpact);

  return (
    <FiatInputValue
      name="receiveInput"
      swapView={swapView}
      percentageChangeText={
        priceImpact?.kind === 'loss' || priceImpact?.kind === 'profit'
          ? `(${priceImpact.percentage})`
          : null
      }
      color={
        isPriceImpactWarning ? 'var(--negative-500)' : 'var(--neutral-600)'
      }
      style={isPriceImpactWarning ? { cursor: 'help' } : undefined}
      title={
        priceImpact?.kind === 'loss'
          ? 'The exchange rate is lower than the market rate. Lack of liquidity affects the exchange rate. Try a lower amount.'
          : undefined
      }
    />
  );
}
