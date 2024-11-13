import React, { useMemo, useRef } from 'react';
import type { CustomConfiguration } from '@zeriontech/transactions';
import QuestionHintIcon from 'jsx:src/ui/assets/question-hint.svg';
import type {
  IncomingTransaction,
  IncomingTransactionWithFrom,
} from 'src/modules/ethereum/types/IncomingTransaction';
import type { Chain } from 'src/modules/networks/Chain';
import { usePreferences } from 'src/ui/features/preferences';
import { VStack } from 'src/ui/ui-kit/VStack';
import { useGasPrices } from 'src/ui/shared/requests/useGasPrices';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { NonceLine } from '../NonceLine';
import { NetworkFee } from '../NetworkFee';
import { useTransactionFee } from './useTransactionFee';

function NetworkFeeLine({
  transaction,
  chain,
  onFeeValueCommonReady,
  configuration,
  onConfigurationChange,
  paymasterPossible,
  paymasterEligible,
  keepPreviousData = false,
}: {
  transaction: IncomingTransactionWithFrom;
  chain: Chain;
  onFeeValueCommonReady: null | ((value: string) => void);
  configuration: CustomConfiguration;
  onConfigurationChange: null | ((value: CustomConfiguration) => void);
  paymasterPossible: boolean;
  paymasterEligible: boolean;
  keepPreviousData?: boolean;
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
      />
    </>
  );
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
  keepPreviousData = false,
}: {
  transaction: IncomingTransaction;
  from: string;
  chain: Chain;
  onFeeValueCommonReady: null | ((value: string) => void);
  configuration: CustomConfiguration;
  onConfigurationChange: null | ((value: CustomConfiguration) => void);
  paymasterEligible: boolean;
  paymasterPossible: boolean;
  keepPreviousData?: boolean;
}) {
  const { preferences } = usePreferences();
  const transactionWithFrom = useMemo(
    () => ({ ...incomingTransaction, from }),
    [from, incomingTransaction]
  );
  return (
    <VStack gap={8}>
      {paymasterEligible ? (
        <HStack gap={8} justifyContent="space-between">
          <UIText kind="small/regular" color="var(--neutral-700)">
            Network Fee
          </UIText>
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
        <NetworkFeeLine
          configuration={configuration}
          onConfigurationChange={onConfigurationChange}
          transaction={transactionWithFrom}
          chain={chain}
          keepPreviousData={keepPreviousData}
          onFeeValueCommonReady={onFeeValueCommonReady}
          paymasterPossible={paymasterPossible}
          paymasterEligible={paymasterEligible}
        />
      )}
      {preferences?.configurableNonce ? (
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
      ) : null}
    </VStack>
  );
}
