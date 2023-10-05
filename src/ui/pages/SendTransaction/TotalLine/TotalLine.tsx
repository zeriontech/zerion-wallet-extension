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
  // TODO: refactor, nativeAsset might be null, but we may still know nativeAssetSymbol
  const { costs, nativeAsset } = transactionFee;
  const { totalValueFiat, totalValueCommon, totalValueExceedsBalance } =
    costs || {};
  let valueElement: JSX.Element | null = null;
  if (totalValueFiat) {
    valueElement = (
      <UIText kind="small/accent">
        {totalValueExceedsBalance ? 'Up to ' : null}
        {formatCurrencyValue(totalValueFiat, 'en', 'usd')}
      </UIText>
    );
  } else if (totalValueCommon) {
    valueElement = (
      <UIText kind="small/accent" title={totalValueCommon.toString()}>
        {totalValueExceedsBalance ? 'Up to ' : null}
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
