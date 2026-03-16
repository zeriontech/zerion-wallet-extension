import React, { useMemo, useRef, useState } from 'react';
import type { CustomConfiguration } from '@zeriontech/transactions';
import QuestionHintIcon from 'jsx:src/ui/assets/question-hint.svg';
import type {
  IncomingTransaction,
  IncomingTransactionWithFrom,
} from 'src/modules/ethereum/types/IncomingTransaction';
import { type Chain } from 'src/modules/networks/Chain';
import { usePreferences } from 'src/ui/features/preferences';
import { VStack } from 'src/ui/ui-kit/VStack';
import { useGasPrices } from 'src/ui/shared/requests/useGasPrices';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import type { NetworkFeeType } from 'src/modules/zerion-api/types/NetworkFeeType';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { formatCurrencyValueExtra } from 'src/shared/units/formatCurrencyValue';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { isEthereumAddress } from 'src/shared/isEthereumAddress';
import type { ActionFee } from 'src/modules/zerion-api/requests/wallet-get-actions';
import type { InterpretResponse } from 'src/modules/zerion-api/requests/wallet-simulate-transaction';
import { NetworkFee } from '../NetworkFee';
import { NonceLine } from '../NonceLine';
import { useTransactionFee } from './useTransactionFee';

/** A simplified version of NetworkFeeLine */
export function NetworkFeeLineInfo({
  label,
  networkFee,
}: {
  label?: React.ReactNode;
  networkFee: NetworkFeeType;
}) {
  const { currency } = useCurrency();
  if (!networkFee.amount) {
    return null;
  }
  return (
    <HStack gap={8} justifyContent="space-between">
      {label !== undefined ? (
        label
      ) : (
        <UIText kind="small/regular">Network Fee</UIText>
      )}

      <UIText kind="small/accent">
        <HStack gap={8} alignItems="center">
          {networkFee.amount?.value != null
            ? formatCurrencyValueExtra(
                networkFee.amount.value,
                'en',
                currency,
                { zeroRoundingFallback: 0.01 }
              )
            : formatTokenValue(
                networkFee.amount.quantity,
                networkFee.fungible?.symbol
              )}
        </HStack>
      </UIText>
    </HStack>
  );
}

export function AddressActionNetworkFee({
  label,
  fee,
  isLoading,
}: {
  label?: React.ReactNode;
  fee: ActionFee;
  isLoading: boolean;
}) {
  return (
    <HStack gap={8} justifyContent="space-between">
      {label !== undefined ? (
        label
      ) : (
        <UIText kind="small/regular">Network Fee</UIText>
      )}

      <UIText kind="small/accent">
        <HStack gap={8} alignItems="center">
          {isLoading ? <CircleSpinner /> : null}

          {fee.free ? (
            <div
              style={{
                background: 'linear-gradient(90deg, #6C6CF9 0%, #FF7583 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Free
            </div>
          ) : fee.amount.value != null ? (
            formatCurrencyValueExtra(
              fee.amount.value,
              'en',
              fee.amount.currency,
              {
                zeroRoundingFallback: 0.01,
              }
            )
          ) : (
            formatTokenValue(fee.amount.quantity, fee.fungible?.symbol)
          )}
        </HStack>
      </UIText>
    </HStack>
  );
}

function NetworkFeeLine({
  transaction,
  chain,
  onFeeValueCommonReady,
  configuration,
  onConfigurationChange,
  paymasterPossible,
  paymasterEligible,
  keepPreviousData = false,
  interpretation,
}: {
  transaction: IncomingTransactionWithFrom;
  chain: Chain;
  onFeeValueCommonReady: null | ((value: string) => void);
  configuration: CustomConfiguration;
  onConfigurationChange: null | ((value: CustomConfiguration) => void);
  paymasterPossible: boolean;
  paymasterEligible: boolean;
  keepPreviousData?: boolean;
  interpretation?: InterpretResponse | null;
}) {
  const { data: chainGasPrices = null } = useGasPrices(chain, {
    suspense: true,
  });
  const transactionFee = useTransactionFee({
    address: transaction.from,
    transaction,
    chain,
    onFeeValueCommonReady,
    networkFeeConfiguration: configuration.networkFee,
    keepPreviousData,
    chainGasPrices,
  });

  const dialogRef = useRef<HTMLDialogElementInterface>(null);

  return (
    <>
      <BottomSheetDialog
        ref={dialogRef}
        height="min-content"
        renderWhenOpen={() => (
          <VStack gap={16}>
            <UIText kind="headline/h3">
              <DialogTitle
                title="Why isn’t it free?"
                alignTitle="start"
                closeKind="icon"
              />
            </UIText>
            <UIText kind="body/regular">
              To fight spam, wallets must qualify for free transactions by
              either depositing funds to Zero or waiting for automatic reloads
            </UIText>
          </VStack>
        )}
      />
      <NetworkFee
        transaction={transaction}
        transactionFee={transactionFee}
        chain={chain}
        chainGasPrices={chainGasPrices}
        networkFeeConfiguration={configuration.networkFee}
        label={<UIText kind="small/regular">Network Fee</UIText>}
        displayValueEnd={
          paymasterPossible && !paymasterEligible ? (
            <>
              <UnstyledButton
                title="Why isn’t it free?"
                onClick={() => dialogRef.current?.showModal()}
              >
                <QuestionHintIcon
                  style={{ display: 'block', color: 'var(--neutral-500)' }}
                />
              </UnstyledButton>
            </>
          ) : null
        }
        onChange={
          onConfigurationChange
            ? (networkFee) =>
                onConfigurationChange({ ...configuration, networkFee })
            : null
        }
        interpretation={interpretation}
      />
    </>
  );
}

let id = 0;
function usePlainId() {
  const [value] = useState(() => id++);
  return value;
}

export function TransactionConfiguration({
  transaction: incomingTransaction,
  from,
  chain,
  onFeeValueCommonReady,
  configuration,
  onConfigurationChange,
  paymasterEligible,
  paymasterPossible,
  paymasterWaiting,
  keepPreviousData = false,
  interpretation,
  interactiveNetworkFee,
  networkFee,
}: {
  transaction: IncomingTransaction;
  from: string;
  chain: Chain;
  onFeeValueCommonReady: null | ((value: string) => void);
  configuration: CustomConfiguration;
  onConfigurationChange: null | ((value: CustomConfiguration) => void);
  paymasterEligible: boolean;
  paymasterPossible: boolean;
  paymasterWaiting: boolean;
  keepPreviousData?: boolean;
  interpretation?: InterpretResponse | null;
  interactiveNetworkFee: boolean;
  networkFee?: NetworkFeeType | null;
}) {
  const { preferences } = usePreferences();
  const transactionWithFrom = useMemo(
    () => ({ ...incomingTransaction, from }),
    [from, incomingTransaction]
  );

  // viewTransitionNames need to be unique when this component is used more than once on the same view
  const id = usePlainId();

  return (
    <VStack gap={8}>
      {paymasterWaiting ? (
        <div style={{ display: 'flex', justifyContent: 'end' }}>
          <CircleSpinner />
        </div>
      ) : paymasterEligible ? (
        <HStack
          style={{
            ['viewTransitionName' as string]: `network-fee-free-line-${id}`,
          }}
          gap={8}
          justifyContent="space-between"
        >
          <UIText kind="small/regular">Network Fee</UIText>
          <UIText
            kind="small/accent"
            style={{
              background: 'linear-gradient(90deg, #6C6CF9 0%, #FF7583 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Free
          </UIText>
        </HStack>
      ) : (
        <div
          style={{
            ['viewTransitionName' as string]: `network-fee-default-line-${id}`,
          }}
        >
          {interactiveNetworkFee ? (
            <NetworkFeeLine
              configuration={configuration}
              onConfigurationChange={onConfigurationChange}
              transaction={transactionWithFrom}
              chain={chain}
              keepPreviousData={keepPreviousData}
              onFeeValueCommonReady={onFeeValueCommonReady}
              paymasterPossible={paymasterPossible}
              paymasterEligible={paymasterEligible}
              interpretation={interpretation}
            />
          ) : networkFee ? (
            <NetworkFeeLineInfo networkFee={networkFee} />
          ) : null}
        </div>
      )}
      {preferences?.configurableNonce && isEthereumAddress(from) ? (
        <div style={{ ['viewTransitionName' as string]: `nonce-line-${id}` }}>
          <NonceLine
            userNonce={configuration.nonce}
            transaction={transactionWithFrom}
            chain={chain}
            onChange={
              onConfigurationChange
                ? (nonce) => onConfigurationChange({ ...configuration, nonce })
                : null
            }
          />
        </div>
      ) : null}
    </VStack>
  );
}
