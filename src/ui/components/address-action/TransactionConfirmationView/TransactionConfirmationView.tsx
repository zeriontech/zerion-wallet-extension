import React from 'react';
import type { CustomConfiguration } from '@zeriontech/transactions';
import type { IncomingTransactionWithChainId } from 'src/modules/ethereum/types/IncomingTransaction';
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
import type { EligibilityQuery } from 'src/modules/ethereum/account-abstraction/shouldInterpretTransaction';
import { usePreferences } from 'src/ui/features/preferences';
import type { GasbackData } from 'src/modules/ethereum/account-abstraction/rewards';
import { WalletAvatar } from '../../WalletAvatar';
import { WalletDisplayName } from '../../WalletDisplayName';
import {
  TransactionSimulation,
  useTxInterpretQuery,
} from '../TransactionSimulation';

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
  localAllowanceQuantityBase,
  onOpenAllowanceForm,
  gasback: gasbackEstimation,
}: {
  title: React.ReactNode;
  wallet: ExternallyOwnedAccount;
  showApplicationLine: boolean;
  transaction: IncomingTransactionWithChainId;
  chain: Chain;
  configuration: CustomConfiguration;
  paymasterEligible: boolean;
  paymasterPossible: boolean;
  eligibilityQuery: EligibilityQuery;
  localAllowanceQuantityBase?: string;
  onOpenAllowanceForm?: () => void;
  gasback: GasbackData | null;
}) {
  const { preferences, query } = usePreferences();

  const txInterpretQuery = useTxInterpretQuery({
    transaction,
    eligibilityQuery,
  });
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
        <TransactionSimulation
          showApplicationLine={showApplicationLine}
          localAllowanceQuantityBase={localAllowanceQuantityBase}
          onOpenAllowanceForm={onOpenAllowanceForm}
          address={wallet.address}
          transaction={transaction}
          paymasterEligible={paymasterEligible}
          txInterpretQuery={txInterpretQuery}
        />
        <Spacer height={20} />
        <React.Suspense
          fallback={
            <div style={{ display: 'flex', justifyContent: 'end' }}>
              <CircleSpinner />
            </div>
          }
        >
          <TransactionConfiguration
            transaction={transaction}
            from={wallet.address}
            chain={chain}
            configuration={configuration}
            onConfigurationChange={null}
            onFeeValueCommonReady={null}
            paymasterEligible={paymasterEligible}
            paymasterPossible={paymasterPossible}
            gasback={
              txInterpretQuery.data?.action.transaction.gasback
                ? { value: txInterpretQuery.data?.action.transaction.gasback }
                : gasbackEstimation
            }
          />
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
