import { isTruthy } from 'is-truthy-ts';
import React, { useRef } from 'react';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/requests';
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
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { useGasPrices } from 'src/ui/shared/requests/useGasPrices';
import type { TransactionFee } from '../TransactionConfiguration/useTransactionFee';
import { NetworkFeeDialog } from './NetworkFeeDialog';
import type { NetworkFeeConfiguration } from './types';
import { NETWORK_SPEED_TO_TITLE } from './constants';

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
  transaction,
  transactionFee,
  chain,
  networkFeeConfiguration,
  onChange,
}: {
  transaction: IncomingTransaction;
  transactionFee: TransactionFee;
  chain: Chain;
  networkFeeConfiguration: NetworkFeeConfiguration;
  onChange(value: NetworkFeeConfiguration): void;
}) {
  const { networks } = useNetworks();
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const {
    isLoading: isTransactionFeeLoading,
    time,
    feeValueCommon,
    feeValueFiat,
    feeEstimation,
    isLoadingNativeAsset,
    noFeeData,
  } = transactionFee;

  const { data: chainGasPrices } = useGasPrices(chain);

  const isLoading =
    isTransactionFeeLoading || (isLoadingNativeAsset && feeValueFiat == null);
  const nativeAssetSymbol =
    networks?.getNetworkByName(chain)?.native_asset?.symbol;

  const isOptimistic = Boolean(chainGasPrices?.info.optimistic);
  const disabled = isLoading || isOptimistic;

  return (
    <>
      <NetworkFeeDialog
        ref={dialogRef}
        value={networkFeeConfiguration}
        onSubmit={(value) => {
          onChange(value);
          dialogRef.current?.close();
        }}
        chain={chain}
        transaction={transaction}
      />
      <HStack gap={8} justifyContent="space-between">
        <UIText kind="small/regular" color="var(--neutral-700)">
          Network Fee
        </UIText>
        {isLoading ? (
          <CircleSpinner
            // size of "small/accent"
            size="20px"
          />
        ) : feeValueFiat || feeValueCommon ? (
          <UnstyledButton
            className={disabled ? undefined : helperStyles.hoverUnderline}
            style={{ color: disabled ? 'var(--black)' : 'var(--primary)' }}
            onClick={() => {
              dialogRef.current?.showModal();
            }}
            disabled={disabled}
          >
            <UIText
              kind="small/accent"
              title={[
                getFeeTypeTitle(feeEstimation?.type),
                feeValueCommon
                  ? formatTokenValue(feeValueCommon, nativeAssetSymbol)
                  : null,
              ]
                .filter(isTruthy)
                .join(' · ')}
            >
              {[
                networkFeeConfiguration.speed === 'custom' && time
                  ? time
                  : null,
                networkFeeConfiguration.speed === 'custom'
                  ? NETWORK_SPEED_TO_TITLE.custom
                  : time ||
                    NETWORK_SPEED_TO_TITLE[networkFeeConfiguration.speed],
                feeValueFiat
                  ? formatCurrencyValue(feeValueFiat, 'en', 'usd')
                  : feeValueCommon
                  ? formatTokenValue(
                      feeValueCommon.toString(),
                      nativeAssetSymbol
                    )
                  : undefined,
              ]
                .filter(isTruthy)
                .join(' · ')}
            </UIText>
          </UnstyledButton>
        ) : noFeeData ? (
          <UIText kind="small/regular" title="No fee data">
            {noValueDash}
          </UIText>
        ) : null}
      </HStack>
    </>
  );
}
