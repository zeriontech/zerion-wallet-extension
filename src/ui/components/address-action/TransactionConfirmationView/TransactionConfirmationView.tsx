import React from 'react';
import type { IncomingTransactionWithChainId } from 'src/modules/ethereum/types/IncomingTransaction';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { focusNode } from 'src/ui/shared/focusNode';
import { Button } from 'src/ui/ui-kit/Button';
import type { Chain } from 'src/modules/networks/Chain';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import type { CustomConfiguration } from 'src/ui/pages/SendTransaction/TransactionConfiguration';
import { TransactionConfiguration } from 'src/ui/pages/SendTransaction/TransactionConfiguration';
import { UIText } from 'src/ui/ui-kit/UIText';
import LedgerIcon from 'jsx:src/ui/assets/ledger-icon.svg';
import { isDeviceAccount } from 'src/shared/types/validators';
import { WalletAvatar } from '../../WalletAvatar';
import { WalletDisplayName } from '../../WalletDisplayName';
import { TransactionSimulation } from '../TransactionSimulation';

export function TransactionConfirmationView({
  title,
  wallet,
  transaction,
  chain,
  configuration,
}: {
  title: React.ReactNode;
  wallet: ExternallyOwnedAccount;
  transaction: IncomingTransactionWithChainId;
  chain: Chain;
  configuration: CustomConfiguration;
}) {
  return (
    <div
      style={{
        ['--surface-background-color' as string]: 'var(--z-index-1-inverted)',
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
        <TransactionSimulation transaction={transaction} />
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
          <Button
            kind="primary"
            value="confirm"
            style={{ whiteSpace: 'nowrap' }}
          >
            <HStack gap={8} alignItems="center" justifyContent="center">
              {isDeviceAccount(wallet) ? <LedgerIcon /> : null}
              Sign and Send
            </HStack>
          </Button>
        </HStack>
      </form>
    </div>
  );
}
