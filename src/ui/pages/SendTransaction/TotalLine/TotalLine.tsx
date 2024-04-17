import React from 'react';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { useCurrency } from 'src/modules/currency/useCurrency';
import type { TransactionFee } from '../TransactionConfiguration/useTransactionFee';

export function TotalLine({
  transactionFee,
}: {
  transactionFee: TransactionFee;
}) {
  const { currency, ready } = useCurrency();
  // TODO: refactor, nativeAsset might be null, but we may still know nativeAssetSymbol
  const { costs, nativeAsset } = transactionFee;
  const { totalValueFiat, totalValueCommon } = costs || {};
  let valueElement: JSX.Element | null = null;
  if (totalValueFiat && ready) {
    valueElement = (
      <UIText kind="small/accent">
        {formatCurrencyValue(totalValueFiat, 'en', currency)}
      </UIText>
    );
  } else if (totalValueCommon) {
    valueElement = (
      <UIText kind="small/accent" title={totalValueCommon.toString()}>
        {formatTokenValue(totalValueCommon, nativeAsset?.symbol)}
      </UIText>
    );
  }
  if (!valueElement) {
    return null;
  }
  return (
    <HStack gap={8} justifyContent="space-between">
      <UIText kind="small/regular" color="var(--neutral-700)">
        Total
      </UIText>
      {valueElement}
    </HStack>
  );
}
