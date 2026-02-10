import React, { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
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
import { NBSP } from 'src/ui/shared/typography';
import { AnimatedAppear } from 'src/ui/components/AnimatedAppear';
import type { GasbackData } from 'src/modules/ethereum/account-abstraction/rewards';
import { PortalToRootNode } from 'src/ui/components/PortalToRootNode';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { FEATURE_LOYALTY_FLOW } from 'src/env/config';
import { useRemoteConfigValue } from 'src/modules/remote-config/useRemoteConfigValue';
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

export function GasbackHint() {
  const dialogRef = useRef<HTMLDialogElementInterface>(null);
  return (
    <>
      <UnstyledButton
        aria-label="What is gasback?"
        type="button"
        onClick={() => dialogRef.current?.showModal()}
      >
        <QuestionHintIcon
          role="presentation"
          style={{
            width: 20,
            height: 20,
            color: 'var(--neutral-500)',
            display: 'block',
          }}
        />
      </UnstyledButton>
      <PortalToRootNode>
        <BottomSheetDialog
          ref={dialogRef}
          height="min-content"
          renderWhenOpen={() => (
            <div style={{ textAlign: 'start' }}>
              <UIText kind="headline/h3">
                <DialogTitle title="Gasback" alignTitle="start" />
              </UIText>
              <Spacer height={16} />
              <UIText kind="small/regular">
                Users earn XP to offset the gas they spend on transactions in
                Zerion.
              </UIText>
            </div>
          )}
        />
      </PortalToRootNode>
    </>
  );
}

/** A simplified version of NetworkFeeLine */
export function NetworkFeeLineInfo({
  label,
  networkFee,
  isLoading,
}: {
  label?: React.ReactNode;
  networkFee: NetworkFeeType;
  isLoading: boolean;
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
          {isLoading ? <CircleSpinner /> : null}

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

          {fee.amount.value != null
            ? formatCurrencyValueExtra(
                fee.amount.value,
                'en',
                fee.amount.currency,
                {
                  zeroRoundingFallback: 0.01,
                }
              )
            : formatTokenValue(fee.amount.quantity, fee.fungible?.symbol)}
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
  gasback: gasbackData,
  listViewTransitions = false,
  interpretation,
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
  gasback: GasbackData | null;
  /** Hacky, experimental and only needed on SendTransaction View because list is stuck to the bottom */
  listViewTransitions?: boolean;
  interpretation?: InterpretResponse | null;
}) {
  const { preferences } = usePreferences();
  const transactionWithFrom = useMemo(
    () => ({ ...incomingTransaction, from }),
    [from, incomingTransaction]
  );
  const gasbackValueOriginal = gasbackData?.value ?? gasbackData?.estimation;
  const [gasback, setGasback] = useState(gasbackValueOriginal);
  const hasGasbackOnFirstRenderRef = useRef(gasback);

  const { data: loyaltyEnabled } = useRemoteConfigValue(
    'extension_loyalty_enabled'
  );
  const FEATURE_GASBACK = loyaltyEnabled && FEATURE_LOYALTY_FLOW === 'on';

  useEffect(() => {
    // EXPERIMENT:
    // Setting state in useEffect is an anti-pattern but we need
    // this update the "list" with startViewTransition
    // Each item in the list must have a unique viewTransitionName
    // It will be animated automatically but can be additionally animated with CSS
    // We want to animate the moving list items because the `gasback` value appears later
    // due to interpetation response.
    if (document.startViewTransition && listViewTransitions) {
      document.startViewTransition(() => {
        flushSync(() => {
          setGasback(gasbackValueOriginal);
        });
      });
    } else {
      setGasback(gasbackValueOriginal);
    }
  }, [gasbackValueOriginal, listViewTransitions]);

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
      {FEATURE_GASBACK ? (
        <AnimatedAppear
          display={Boolean(gasback)}
          from={
            !listViewTransitions || hasGasbackOnFirstRenderRef.current
              ? /* no animation */ { y: 0 }
              : { opacity: 0, y: 20 }
          }
          config={{ tension: 300, friction: 20 }}
        >
          <HStack gap={8} justifyContent="space-between" aria-hidden={!gasback}>
            <UIText kind="small/regular">
              <HStack gap={4}>
                <span>Gasback</span>
                <GasbackHint />
              </HStack>
            </UIText>
            <UIText
              kind="small/accent"
              style={{
                background: 'linear-gradient(90deg, #6C6CF9 0%, #FF7583 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {gasbackData?.value == null ? 'Up to ' : null}
              {new Intl.NumberFormat('en').format(gasback || 0)}
              {NBSP}XP
            </UIText>
          </HStack>
        </AnimatedAppear>
      ) : null}
    </VStack>
  );
}
