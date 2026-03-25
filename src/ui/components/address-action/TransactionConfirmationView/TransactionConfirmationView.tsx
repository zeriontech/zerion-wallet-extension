import React, { useMemo } from 'react';
import type { CustomConfiguration } from '@zeriontech/transactions';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { focusNode } from 'src/ui/shared/focusNode';
import { Button, HoldableButton } from 'src/ui/ui-kit/Button';
import {
  KeyboardShortcut,
  ShortcutHint,
} from 'src/ui/components/KeyboardShortcut';
import { useWindowFocus } from 'src/ui/shared/useWindowFocus';
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
import { invariant } from 'src/shared/invariant';
import type { LocalAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import { WalletAvatar } from '../../WalletAvatar';
import { WalletDisplayName } from '../../WalletDisplayName';
import { TransactionSimulation } from '../TransactionSimulation';

const TRANSACTION_CONFIRMATION_BUTTON_ID = 'transaction-confirmation-button';

export function TransactionConfirmationView({
  title,
  wallet,
  transactions,
  chain,
  configuration,
  paymasterEligible,
  paymasterPossible,
  eligibilityQuery,
  customAllowanceValueBase,
  onOpenAllowanceForm,
  fallbackAddressAction,
}: {
  title: React.ReactNode;
  wallet: ExternallyOwnedAccount;
  transactions: MultichainTransaction[];
  chain: Chain;
  configuration: CustomConfiguration;
  paymasterEligible: boolean;
  paymasterPossible: boolean;
  /** TODO: @deprecate */
  eligibilityQuery: EligibilityQuery;
  customAllowanceValueBase?: string;
  onOpenAllowanceForm?: () => void;
  fallbackAddressAction: LocalAddressAction | null;
}) {
  const { preferences, query } = usePreferences();
  invariant(
    transactions.length,
    'At least one transaction is required for interpretation'
  );

  const txInterpretQuery = useInterpretTxBasedOnEligibility({
    address: wallet.address,
    transactions,
    eligibilityQuery,
    origin: 'https://app.zerion.io',
  });

  const interpretationString = useMemo(() => {
    return JSON.stringify(txInterpretQuery.data?.data.action);
  }, [txInterpretQuery]);

  const windowFocused = useWindowFocus();
  const shortcutActive =
    Boolean(preferences?.enableKeyboardShortcutToSign) && !query.isLoading;

  if (query.isLoading) {
    return null;
  }

  return (
    <>
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
            transaction={transactions.at(-1)!} // guarded by invariant above
            txInterpretQuery={txInterpretQuery}
            fallbackAddressAction={fallbackAddressAction}
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
              {transactions.length === 1 && transactions[0].evm ? (
                <TransactionConfiguration
                  transaction={transactions[0].evm}
                  from={wallet.address}
                  chain={chain}
                  configuration={configuration}
                  onConfigurationChange={null}
                  onFeeValueCommonReady={null}
                  paymasterEligible={paymasterEligible}
                  paymasterPossible={paymasterPossible}
                  paymasterWaiting={false}
                  interactiveNetworkFee={true}
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
            style={{
              gridTemplateColumns: shortcutActive ? '1fr 2fr' : '1fr 1fr',
            }}
          >
            <Button value="cancel" kind="regular" ref={focusNode}>
              Cancel
            </Button>
            <KeyboardShortcut
              combination="mod+enter"
              onKeyDown={() => {
                const btn = document.getElementById(
                  TRANSACTION_CONFIRMATION_BUTTON_ID
                );
                btn?.click();
              }}
              disabled={!shortcutActive}
            />
            {isDeviceAccount(wallet) ? (
              <Button
                kind="primary"
                value={interpretationString ?? 'confirm'}
                style={{
                  whiteSpace: 'nowrap',
                  paddingInline: shortcutActive ? 0 : undefined,
                }}
              >
                <HStack gap={8} alignItems="center" justifyContent="center">
                  <LedgerIcon />
                  Sign and Send
                  {shortcutActive && windowFocused ? <ShortcutHint /> : null}
                </HStack>
              </Button>
            ) : preferences?.enableHoldToSignButton ? (
              <HoldableButton
                text={
                  <HStack gap={4} alignItems="center" justifyContent="center">
                    Hold to Sign
                    {shortcutActive && windowFocused ? <ShortcutHint /> : null}
                  </HStack>
                }
                submittingText="Signing..."
                value={interpretationString ?? 'confirm'}
                style={shortcutActive ? { paddingInline: 0 } : undefined}
              />
            ) : (
              <Button
                kind="primary"
                id={TRANSACTION_CONFIRMATION_BUTTON_ID}
                value={interpretationString ?? 'confirm'}
                style={{
                  whiteSpace: 'nowrap',
                  paddingInline: shortcutActive ? 0 : undefined,
                }}
              >
                <HStack gap={4} alignItems="center" justifyContent="center">
                  Sign and Send
                  {shortcutActive && windowFocused ? <ShortcutHint /> : null}
                </HStack>
              </Button>
            )}
          </HStack>
        </form>
      </div>
    </>
  );
}
