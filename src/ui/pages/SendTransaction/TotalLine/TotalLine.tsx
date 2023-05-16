import React from 'react';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import type { TransactionFee } from '../TransactionConfiguration/useTransactionFee';

export function TotalLine({
  transactionFee,
}: {
  transactionFee: TransactionFee;
}) {
  const { totalValueFiat, totalValueCommon, nativeAsset } = transactionFee;
  let valueElement: JSX.Element | null = null;
  if (totalValueFiat) {
    valueElement = (
      <UIText kind="small/accent">
        {formatCurrencyValue(totalValueFiat, 'en', 'usd')}
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
