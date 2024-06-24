import { useSelectorStore } from '@store-unit/react';
import type { SwapFormView } from '@zeriontech/transactions';
import BigNumber from 'bignumber.js';
import React from 'react';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { formatPercent } from 'src/shared/units/formatPercent/formatPercent';
import { UIText } from 'src/ui/ui-kit/UIText';
import { isNumeric } from 'src/shared/isNumeric';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { exceedsPriceImpactThreshold } from '../../shared/price-impact';

export function FiatInputValue({
  swapView,
  name,
}: {
  swapView: SwapFormView;
  name: 'spendInput' | 'receiveInput';
}) {
  const { currency } = useCurrency();
  const { receiveAsset, spendAsset } = swapView;
  const { primaryInput, spendInput, receiveInput } = useSelectorStore(
    swapView.store,
    ['primaryInput', 'receiveInput', 'spendInput']
  );

  const asset = name === 'receiveInput' ? receiveAsset : spendAsset;
  const oppositeAsset = asset === receiveAsset ? spendAsset : receiveAsset;
  const inputValue = name === 'receiveInput' ? receiveInput : spendInput;
  const oppositeInputValue =
    name === 'receiveInput' ? spendInput : receiveInput;
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

  let diff: BigNumber | null = null;
  if (name === 'receiveInput') {
    const oppositeFiatValue = new BigNumber(oppositeInputValue || 0).times(
      oppositeAsset?.price?.value || 0
    );
    diff = oppositeFiatValue.isGreaterThan(0)
      ? fiatValue.minus(oppositeFiatValue).div(oppositeFiatValue)
      : null;
  }

  const formattedDiff = diff
    ? `${diff.isLessThan(0) ? '' : '+'}${formatPercent(diff.times(100), 'en')}%`
    : null;

  const isPriceImpactWarning = diff
    ? exceedsPriceImpactThreshold({ relativeChange: diff })
    : false;

  return (
    <UIText
      kind="small/regular"
      color={
        isPriceImpactWarning ? 'var(--negative-500)' : 'var(--neutral-600)'
      }
      style={isPriceImpactWarning ? { cursor: 'help' } : undefined}
      title={
        isPriceImpactWarning
          ? 'The exchange rate is lower than the market rate. Lack of liquidity affects the exchange rate. Try a lower amount.'
          : undefined
      }
    >
      {isPrimaryInput ? null : '≈'}
      {formatCurrencyValue(fiatValue, 'en', currency)}{' '}
      {formattedDiff ? `(${formattedDiff})` : null}
    </UIText>
  );
}
