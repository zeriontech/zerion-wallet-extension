import { isTruthy } from 'is-truthy-ts';
import React, { useRef } from 'react';
import type { NetworkFeeConfiguration } from '@zeriontech/transactions';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/types';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { noValueDash } from 'src/ui/shared/typography';
import * as helperStyles from 'src/ui/style/helpers.module.css';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import type { Chain } from 'src/modules/networks/Chain';
import type { IncomingTransactionWithFrom } from 'src/modules/ethereum/types/IncomingTransaction';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { useCurrency } from 'src/modules/currency/useCurrency';
import type { TransactionFee } from '../TransactionConfiguration/useTransactionFee';
import { NetworkFeeDialog } from './NetworkFeeDialog';
import { NETWORK_SPEED_TO_TITLE } from './constants';

function getFeeTypeTitle(
  type: Exclude<keyof ChainGasPrice['fast'], 'eta'> | undefined
) {
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
  transaction,
  transactionFee,
  chain,
  networkFeeConfiguration,
  chainGasPrices,
  customViewOnly,
  onChange,
  label,
  renderDisplayValue,
}: {
  transaction: IncomingTransactionWithFrom;
  transactionFee: TransactionFee;
  chain: Chain;
  networkFeeConfiguration: NetworkFeeConfiguration;
  chainGasPrices: ChainGasPrice | null;
  onChange: null | ((value: NetworkFeeConfiguration) => void);
  customViewOnly?: boolean;
  label?: React.ReactNode;
  renderDisplayValue?: (params: {
    hintTitle: string;
    displayValue: string;
  }) => React.ReactNode;
}) {
  const { networks } = useNetworks();
  const { currency } = useCurrency();
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const { time, feeEstimation, feeEstimationQuery, costs, costsQuery } =
    transactionFee;
  const {
    feeValueCommon: expectedFeeValueCommon,
    maxFeeValueCommon,
    relevantFeeValueFiat: feeValueFiat,
    relevantFeeValueCommon: feeValueCommon,
    totalValueExceedsBalance,
  } = costs || {};

  const isLoading = feeEstimationQuery.isLoading || costsQuery.isLoading;

  const nativeAssetSymbol =
    networks?.getNetworkByName(chain)?.native_asset?.symbol;

  const disabled = isLoading || !onChange;

  const feeValuePrefix = totalValueExceedsBalance ? 'Up to ' : '';
  const feeValueFormatted = feeValueFiat
    ? formatCurrencyValue(feeValueFiat, 'en', currency)
    : feeValueCommon
    ? formatTokenValue(feeValueCommon.toString(), nativeAssetSymbol)
    : undefined;

  const hintTitle = [
    getFeeTypeTitle(feeEstimation?.type),
    expectedFeeValueCommon
      ? `${totalValueExceedsBalance ? 'Expected Fee: ' : ''}${formatTokenValue(
          expectedFeeValueCommon,
          nativeAssetSymbol
        )}`
      : null,
    totalValueExceedsBalance && maxFeeValueCommon
      ? `Max Fee: ${formatTokenValue(maxFeeValueCommon, nativeAssetSymbol)}`
      : null,
  ]
    .filter(isTruthy)
    .join(' · ');

  const displayValue = feeValueFormatted
    ? [
        networkFeeConfiguration.speed === 'custom' && time ? time : null,
        networkFeeConfiguration.speed === 'custom'
          ? NETWORK_SPEED_TO_TITLE.custom
          : time || NETWORK_SPEED_TO_TITLE[networkFeeConfiguration.speed],
        `${feeValuePrefix}${feeValueFormatted}`,
      ]
        .filter(isTruthy)
        .join(' · ')
    : null;

  return (
    <>
      {onChange ? (
        <NetworkFeeDialog
          ref={dialogRef}
          value={networkFeeConfiguration}
          onSubmit={(value) => {
            onChange(value);
            dialogRef.current?.close();
          }}
          chain={chain}
          chainGasPrices={chainGasPrices}
          transaction={transaction}
          customViewOnly={customViewOnly}
        />
      ) : null}
      <HStack gap={8} justifyContent="space-between">
        {label !== undefined ? (
          label
        ) : (
          <UIText kind="small/regular" color="var(--neutral-700)">
            Network Fee
          </UIText>
        )}
        {isLoading ? (
          <CircleSpinner />
        ) : displayValue ? (
          <HStack gap={12} alignItems="center">
            {feeEstimationQuery.isPreviousData ? <CircleSpinner /> : null}
            <UnstyledButton
              type="button"
              className={disabled ? undefined : helperStyles.hoverUnderline}
              style={{
                color: disabled ? 'var(--black)' : 'var(--primary)',
                cursor: !onChange ? 'auto' : undefined,
              }}
              onClick={() => {
                dialogRef.current?.showModal();
              }}
              disabled={disabled}
            >
              {renderDisplayValue?.({ hintTitle, displayValue }) ?? (
                <UIText kind="small/accent" title={hintTitle}>
                  {displayValue}
                </UIText>
              )}
            </UnstyledButton>
          </HStack>
        ) : feeEstimationQuery.isSuccess ? (
          <UIText kind="small/regular" title="No fee data">
            {noValueDash}
          </UIText>
        ) : null}
      </HStack>
    </>
  );
}
