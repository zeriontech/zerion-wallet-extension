import BigNumber from 'bignumber.js';
import { isTruthy } from 'src/shared/isTruthy';
import React, { useEffect, useRef } from 'react';
import type { NetworkFeeConfiguration } from 'src/shared/types/TransactionConfiguration';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/types';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { noValueDash } from 'src/shared/typography';
import { NetworkFeeLevelLabel } from 'src/ui/shared/NetworkFeeLevelLabel';
import * as helperStyles from 'src/ui/style/helpers.module.css';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import type { Chain } from 'src/modules/networks/Chain';
import type { IncomingTransactionWithFrom } from 'src/modules/ethereum/types/IncomingTransaction';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { formatCurrencyValueExtra } from 'src/shared/units/formatCurrencyValue';
import type { TransactionFee } from '../TransactionConfiguration/useTransactionFee';
import { NetworkFeeDialog } from './NetworkFeeDialog';
import { NetworkFeeHint } from './NetworkFeeHint';
import { getNetworkFeeDisplayValue } from './getNetworkFeeDisplayValue';

const noop = () => {};

function getFeeTypeTitle(type: 'eip1559' | 'classic' | 'optimistic' | undefined) {
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
  displayValueEnd,
  expectedGas,
  onFeeValueFiatReady,
  showFeeHint = false,
  onFeeHintShown,
  preserveTransactionMaxFee = false,
}: {
  transaction: IncomingTransactionWithFrom;
  transactionFee: TransactionFee;
  chain: Chain;
  networkFeeConfiguration: NetworkFeeConfiguration;
  chainGasPrices: ChainGasPrice | null;
  onChange: null | ((value: NetworkFeeConfiguration) => void);
  customViewOnly?: boolean;
  label?: React.ReactNode;
  renderDisplayValue?: (params: { hintTitle: string; displayValue: string }) => React.ReactNode;
  displayValueEnd?: React.ReactNode;
  /** Expected gas units the displayed fee is priced on (WLT-2743). */
  expectedGas?: number | null;
  /** The expected fee in fiat that the user sees, for analytics. */
  onFeeValueFiatReady?: (value: number | null) => void;
  /** Offer Slow when Fast minus Slow reaches the remote-config threshold. */
  showFeeHint?: boolean;
  /** Reports that the hint was shown, so the sign flow can attach `fee_hint_shown`. */
  onFeeHintShown?: () => void;
  /** Match the fee estimation's dapp max-fee handling when pricing the hint. */
  preserveTransactionMaxFee?: boolean;
}) {
  const { networks } = useNetworks();
  const { currency } = useCurrency();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const { time, feeEstimation, feeEstimationQuery, costs, costsQuery } = transactionFee;
  const {
    feeValueCommon: expectedFeeValueCommon,
    feeValueFiat: expectedFeeValueFiat,
    maxFeeValueCommon,
    relevantFeeValueFiat: feeValueFiat,
    relevantFeeValueCommon: feeValueCommon,
    totalValueExceedsBalance,
  } = costs || {};

  const isLoading = feeEstimationQuery.isLoading || costsQuery.isLoading;

  const nativeAssetSymbol = networks?.getNetworkByName(chain)?.baseAsset?.symbol;

  const disabled = isLoading || !onChange;

  useEffect(() => {
    const expectedFeeFiat =
      expectedFeeValueFiat == null ? null : new BigNumber(expectedFeeValueFiat).toNumber();
    onFeeValueFiatReady?.(expectedFeeFiat ?? null);
  }, [expectedFeeValueFiat, onFeeValueFiatReady]);

  const feeValuePrefix = totalValueExceedsBalance ? 'Up to ' : '';
  const feeValueFormatted = feeValueFiat
    ? formatCurrencyValueExtra(feeValueFiat, 'en', currency, {
        zeroRoundingFallback: 0.01,
      })
    : feeValueCommon
      ? formatTokenValue(feeValueCommon.toString(), nativeAssetSymbol)
      : undefined;

  const hintTitle = [
    getFeeTypeTitle(feeEstimation?.type),
    expectedFeeValueCommon
      ? `${totalValueExceedsBalance ? 'Expected Fee: ' : ''}${formatTokenValue(
          expectedFeeValueCommon,
          nativeAssetSymbol,
        )}`
      : null,
    totalValueExceedsBalance && maxFeeValueCommon
      ? `Max Fee: ${formatTokenValue(maxFeeValueCommon, nativeAssetSymbol)}`
      : null,
  ]
    .filter(isTruthy)
    .join(' · ');

  const displayValue = getNetworkFeeDisplayValue({
    speed: networkFeeConfiguration.speed,
    time,
    feeValueFormatted,
    feeValuePrefix,
    customViewOnly: Boolean(customViewOnly),
  });

  return (
    <>
      {onChange ? (
        <NetworkFeeDialog
          ref={dialogRef}
          value={networkFeeConfiguration}
          onSubmit={(value) => {
            onChange(value);
          }}
          onDismiss={() => {
            dialogRef.current?.close();
          }}
          chain={chain}
          chainGasPrices={chainGasPrices}
          transaction={transaction}
          customViewOnly={customViewOnly}
          expectedGas={expectedGas}
        />
      ) : null}
      <HStack gap={8} justifyContent="space-between">
        {label !== undefined ? label : <UIText kind="small/regular">Network Fee</UIText>}
        {isLoading ? (
          <CircleSpinner />
        ) : displayValue ? (
          <HStack gap={0} alignItems="center">
            <HStack gap={12} alignItems="center">
              {feeEstimationQuery.isPreviousData ? <CircleSpinner /> : null}
              <UnstyledButton
                type="button"
                aria-label="Network Fee"
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
                <HStack gap={4} alignItems="center">
                  {customViewOnly ? null : (
                    <NetworkFeeLevelLabel
                      speed={networkFeeConfiguration.speed}
                      separatorColor="var(--primary)"
                    />
                  )}
                  {renderDisplayValue?.({ hintTitle, displayValue }) ?? (
                    <UIText kind="small/accent" title={hintTitle}>
                      {displayValue}
                      {displayValueEnd ? ' · ' : null}
                    </UIText>
                  )}
                </HStack>
              </UnstyledButton>
            </HStack>
            {displayValueEnd}
          </HStack>
        ) : feeEstimationQuery.isSuccess ? (
          <UIText kind="small/regular" title="No fee data">
            {noValueDash}
          </UIText>
        ) : null}
      </HStack>
      {showFeeHint && onChange && networkFeeConfiguration.speed === 'fast' ? (
        <NetworkFeeHint
          transaction={transaction}
          chain={chain}
          networkFeeConfiguration={networkFeeConfiguration}
          chainGasPrices={chainGasPrices}
          fastTransactionFee={transactionFee}
          expectedGas={expectedGas}
          preserveTransactionMaxFee={preserveTransactionMaxFee}
          onSelectSlow={() => onChange({ ...networkFeeConfiguration, speed: 'average' })}
          onShown={onFeeHintShown ?? noop}
        />
      ) : null}
    </>
  );
}
