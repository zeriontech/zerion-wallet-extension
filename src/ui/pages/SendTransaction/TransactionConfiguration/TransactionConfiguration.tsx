import React, { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
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
import { NBSP } from 'src/ui/shared/typography';
import { AnimatedAppear } from 'src/ui/components/AnimatedAppear';
import type { GasbackData } from 'src/modules/ethereum/account-abstraction/rewards';
import { PortalToRootNode } from 'src/ui/components/PortalToRootNode';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { FEATURE_LOYALTY_FLOW } from 'src/env/config';
import { NonceLine } from '../NonceLine';
import { NetworkFee } from '../NetworkFee';
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
            width: 16,
            height: 16,
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
                Users get XP as compensation for the gas fees they spend on
                other networks in the Zerion wallet.
              </UIText>
            </div>
          )}
        />
      </PortalToRootNode>
    </>
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
        label={
          <UIText kind="small/regular" color="var(--neutral-700)">
            Network Fee
          </UIText>
        }
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
  keepPreviousData = false,
  gasback: gasbackData,
  listViewTransitions = false,
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
  gasback: GasbackData | null;
  /** Hacky, experimental and only needed on SendTransaction View because list is stuck to the bottom */
  listViewTransitions?: boolean;
}) {
  const { preferences } = usePreferences();
  const transactionWithFrom = useMemo(
    () => ({ ...incomingTransaction, from }),
    [from, incomingTransaction]
  );
  const gasbackValueOriginal = gasbackData?.value ?? gasbackData?.estimation;
  const [gasback, setGasback] = useState(gasbackValueOriginal);
  const hasGasbackOnFirstRenderRef = useRef(gasback);

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
      {paymasterEligible ? (
        <HStack
          style={{
            ['viewTransitionName' as string]: `network-fee-free-line-${id}`,
          }}
          gap={8}
          justifyContent="space-between"
        >
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
          />
        </div>
      )}
      {preferences?.configurableNonce ? (
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
      {FEATURE_LOYALTY_FLOW === 'on' ? (
        <AnimatedAppear
          display={Boolean(gasback)}
          from={
            !listViewTransitions || hasGasbackOnFirstRenderRef.current
              ? /* no animation */ { y: 0 }
              : { opacity: 0, y: 20 }
          }
          config={{ tension: 300, friction: 20 }}
        >
          <HStack
            style={{ ['viewTransitionName' as string]: `gasback-line-${id}` }}
            gap={8}
            justifyContent="space-between"
            aria-hidden={!gasback}
          >
            <UIText kind="small/regular" color="var(--neutral-700)">
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
