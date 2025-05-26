import React, { useEffect } from 'react';
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
import { solFromBase64 } from 'src/modules/solana/transactions/create';
import { parseSolanaTransaction } from 'src/modules/solana/transactions/parseSolanaTransaction';
import { WalletAvatar } from '../../WalletAvatar';
import { WalletDisplayName } from '../../WalletDisplayName';
import { TransactionSimulation } from '../TransactionSimulation';
import { AddressActionComponent } from '../AddressActionDetails/AddressActionDetails';

export function TransactionConfirmationView({
  title,
  wallet,
  showApplicationLine,
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
  title: React.ReactNode;
  wallet: ExternallyOwnedAccount;
  showApplicationLine: boolean;
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
    transaction,
    eligibilityQuery,
    origin: 'https://app.zerion.io',
  });
  const gasbackValue =
    txInterpretQuery.data?.action?.transaction.gasback ?? null;
  useEffect(() => {
    if (gasbackValue != null) {
      onGasbackReady?.(gasbackValue);
    }
  }, [gasbackValue, onGasbackReady]);
  if (query.isLoading) {
    return null;
  }

  return (
    <div
      style={{
        ['--surface-background-color' as string]: 'var(--neutral-100)',
        display: 'grid',
        gap: 24,
        gridTemplateRows: 'auto 1fr',
        flexGrow: 1,
      }}
    >
      <div style={{ display: 'grid', placeItems: 'center' }}>
        <UIText kind="headline/h2" style={{ textAlign: 'center' }}>
          {title}
        </UIText>
        <Spacer height={8} />
        <HStack gap={8} alignItems="center">
          <WalletAvatar
            address={wallet.address}
            size={20}
            active={false}
            borderRadius={4}
          />
          <UIText kind="small/regular">
            <WalletDisplayName wallet={wallet} />
          </UIText>
        </HStack>
      </div>
      <form
        method="dialog"
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        {transaction.evm ? (
          <TransactionSimulation
            showApplicationLine={showApplicationLine}
            customAllowanceValueBase={customAllowanceValueBase}
            onOpenAllowanceForm={onOpenAllowanceForm}
            address={wallet.address}
            transaction={transaction.evm}
            txInterpretQuery={txInterpretQuery}
          />
        ) : (
          <AddressActionComponent
            address={wallet.address}
            showApplicationLine={true}
            addressAction={parseSolanaTransaction(
              wallet.address,
              solFromBase64(transaction.solana)
            )}
          />
        )}
        <Spacer height={20} />
        <React.Suspense
          fallback={
            <div style={{ display: 'flex', justifyContent: 'end' }}>
              <CircleSpinner />
            </div>
          }
        >
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
                txInterpretQuery.data?.action?.transaction.gasback != null
                  ? { value: txInterpretQuery.data?.action.transaction.gasback }
                  : null
              }
            />
          ) : null}
        </React.Suspense>
        <Spacer height={20} />
        <HStack
          gap={12}
          justifyContent="center"
          style={{
            marginTop: 'auto',
            gridTemplateColumns: '1fr 1fr',
          }}
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
  );
}
