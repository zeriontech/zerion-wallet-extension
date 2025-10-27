import React, { useEffect, useMemo } from 'react';
import type { CustomConfiguration } from '@zeriontech/transactions';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { focusNode } from 'src/ui/shared/focusNode';
import { Button, HoldableButton } from 'src/ui/ui-kit/Button';
import type { Chain } from 'src/modules/networks/Chain';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { TransactionConfiguration } from 'src/ui/pages/SendTransaction/TransactionConfiguration';
import { UIText } from 'src/ui/ui-kit/UIText';
import LedgerIcon from 'jsx:src/ui/assets/ledger-icon.svg';
import { isDeviceAccount } from 'src/shared/types/validators';
import type { EligibilityQuery } from 'src/ui/components/address-action/EligibilityQuery';
import { usePreferences } from 'src/ui/features/preferences';
import { useInterpretTxBasedOnEligibility } from 'src/ui/shared/requests/uiInterpretTransaction';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import { SecurityStatusBackground } from 'src/ui/shared/security-check';
import { VStack } from 'src/ui/ui-kit/VStack';
import { AddressActionNetworkFee } from 'src/ui/pages/SendTransaction/TransactionConfiguration/TransactionConfiguration';
import { WalletAvatar } from '../../WalletAvatar';
import { WalletDisplayName } from '../../WalletDisplayName';
import { TransactionSimulation } from '../TransactionSimulation';

export function TransactionConfirmationView({
  formId,
  title,
  wallet,
  transaction,
  chain,
  configuration,
  paymasterEligible,
  paymasterPossible,
  eligibilityQuery,
  customAllowanceValueBase,
  onOpenAllowanceForm,
  onGasbackReady,
}: {
  formId: string;
  title: React.ReactNode;
  wallet: ExternallyOwnedAccount;
  transaction: MultichainTransaction;
  chain: Chain;
  configuration: CustomConfiguration;
  paymasterEligible: boolean;
  paymasterPossible: boolean;
  /** TODO: @deprecate */
  eligibilityQuery: EligibilityQuery;
  customAllowanceValueBase?: string;
  onOpenAllowanceForm?: () => void;
  onGasbackReady: null | ((value: number) => void);
}) {
  const { preferences, query } = usePreferences();

  const txInterpretQuery = useInterpretTxBasedOnEligibility({
    address: wallet.address,
    transaction,
    eligibilityQuery,
    origin: 'https://app.zerion.io',
  });
  const gasbackValue = txInterpretQuery.data?.data.action?.gasback ?? null;
  useEffect(() => {
    if (gasbackValue != null) {
      onGasbackReady?.(gasbackValue);
    }
  }, [gasbackValue, onGasbackReady]);

  const interpretationString = useMemo(() => {
    return JSON.stringify(txInterpretQuery.data?.data.action);
  }, [txInterpretQuery]);

  if (query.isLoading) {
    return null;
  }

  return (
    <>
      <input
        type="hidden"
        name="interpretation"
        value={interpretationString ?? ''}
        form={formId}
      />
      <SecurityStatusBackground />
      <div
        style={{
          ['--surface-background-color' as string]: 'var(--neutral-100)',
          display: 'grid',
          gap: 8,
          gridTemplateRows: 'auto 1fr',
          flexGrow: 1,
          position: 'relative',
        }}
      >
        <VStack
          gap={8}
          style={{
            justifyItems: 'center',
            paddingBlock: 24,
            border: '1px solid var(--neutral-200)',
            backgroundColor: 'var(--light-background-transparent)',
            backdropFilter: 'blur(16px)',
            borderRadius: 12,
          }}
        >
          <UIText kind="headline/h2">
            {txInterpretQuery.data?.data.action?.type.displayValue ?? title}
          </UIText>
          <HStack gap={8} alignItems="center">
            <WalletAvatar
              address={wallet.address}
              size={20}
              active={false}
              borderRadius={6}
            />
            <UIText kind="small/regular">
              <WalletDisplayName wallet={wallet} />
            </UIText>
          </HStack>
        </VStack>
        <form
          method="dialog"
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          <TransactionSimulation
            customAllowanceValueBase={customAllowanceValueBase}
            onOpenAllowanceForm={onOpenAllowanceForm}
            address={wallet.address}
            transaction={transaction}
            txInterpretQuery={txInterpretQuery}
          />
          <Spacer height={20} />
          <React.Suspense
            fallback={
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'end',
                  marginTop: 'auto',
                }}
              >
                <CircleSpinner />
              </div>
            }
          >
            <div style={{ marginTop: 'auto' }}>
              {transaction.evm ? (
                <TransactionConfiguration
                  transaction={transaction.evm}
                  from={wallet.address}
                  chain={chain}
                  configuration={configuration}
                  onConfigurationChange={null}
                  onFeeValueCommonReady={null}
                  paymasterEligible={paymasterEligible}
                  paymasterPossible={paymasterPossible}
                  paymasterWaiting={false}
                  gasback={
                    txInterpretQuery.data?.data.action?.gasback != null
                      ? { value: txInterpretQuery.data?.data.action.gasback }
                      : null
                  }
                />
              ) : txInterpretQuery.data?.data.action?.fee ? (
                <AddressActionNetworkFee
                  fee={txInterpretQuery.data?.data.action.fee}
                  isLoading={txInterpretQuery.isLoading}
                />
              ) : null}
            </div>
          </React.Suspense>
          <Spacer height={20} />
          <HStack
            gap={12}
            justifyContent="center"
            style={{ gridTemplateColumns: '1fr 1fr' }}
          >
            <Button value="cancel" kind="regular" ref={focusNode}>
              Cancel
            </Button>
            {isDeviceAccount(wallet) ? (
              <Button
                kind="primary"
                value="confirm"
                style={{ whiteSpace: 'nowrap' }}
              >
                <HStack gap={8} alignItems="center" justifyContent="center">
                  <LedgerIcon />
                  Sign and Send
                </HStack>
              </Button>
            ) : preferences?.enableHoldToSignButton ? (
              <HoldableButton
                text="Hold to Sign"
                submittingText="Signing..."
                value="confirm"
              />
            ) : (
              <Button
                kind="primary"
                value="confirm"
                style={{ whiteSpace: 'nowrap' }}
              >
                Sign and Send
              </Button>
            )}
          </HStack>
        </form>
      </div>
    </>
  );
}
