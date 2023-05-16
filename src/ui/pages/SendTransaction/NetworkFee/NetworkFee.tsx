import { isTruthy } from 'is-truthy-ts';
import React from 'react';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/requests';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { VStack } from 'src/ui/ui-kit/VStack';
import { noValueDash } from 'src/ui/shared/typography';
import type { TransactionFee } from '../TransactionConfiguration/useTransactionFee';

function getFeeTypeTitle(type: keyof ChainGasPrice['info'] | undefined) {
  if (!type) {
    return undefined;
  }
  if (type === 'classic') {
    return undefined;
  }
  const labels = { eip1559: 'EIP-1559', optimistic: 'Optimistic' } as const;
  return labels[type];
}

export function NetworkFee({
  transactionFee,
}: {
  transactionFee: TransactionFee;
}) {
  const {
    isLoading,
    time,
    feeValueCommon,
    feeValueFiat,
    feeEstimation,
    nativeAsset,
    isLoadingNativeAsset,
    noFeeData,
  } = transactionFee;

  return (
    <HStack gap={8} justifyContent="space-between">
      <UIText kind="small/regular" color="var(--neutral-700)">
        Network Fee
      </UIText>
      <VStack gap={4}>
        {isLoading || (isLoadingNativeAsset && feeValueFiat == null) ? (
          <CircleSpinner
            // size of "small/accent"
            size="20px"
          />
        ) : feeValueFiat ? (
          <UIText
            kind="small/accent"
            title={[
              getFeeTypeTitle(feeEstimation?.type),
              feeValueCommon
                ? formatTokenValue(feeValueCommon, nativeAsset?.symbol)
                : null,
            ]
              .filter(isTruthy)
              .join(' · ')}
          >
            {[time, formatCurrencyValue(feeValueFiat, 'en', 'usd')]
              .filter(isTruthy)
              .join(' · ')}
          </UIText>
        ) : noFeeData ? (
          <UIText kind="small/regular" title="No fee data">
            {noValueDash}
          </UIText>
        ) : null}
      </VStack>
    </HStack>
  );
}
