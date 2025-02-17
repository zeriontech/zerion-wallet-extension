import React from 'react';
import type { NetworkFeeConfiguration } from '@zeriontech/transactions';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import type { Chain } from 'src/modules/networks/Chain';
import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import { ZStack } from 'src/ui/ui-kit/ZStack';
import { RenderArea } from 'react-area';
import { InsufficientFundsWarning } from './InsufficientFundsWarning';
import { TransactionWarning } from './TransactionWarning';

export function TransactionWarnings({
  address,
  transaction,
  addressAction,
  chain,
  networkFeeConfiguration,
  paymasterEligible,
}: {
  address: string;
  transaction: IncomingTransaction;
  addressAction: AnyAddressAction;
  chain: Chain;
  networkFeeConfiguration: NetworkFeeConfiguration;
  paymasterEligible: boolean;
}) {
  return (
    <ZStack hideLowerElements={true}>
      <RenderArea name="transaction-warning-section" />
      {addressAction.transaction.status === 'failed' ? (
        <>
          <TransactionWarning
            title="Transaction may fail"
            message="This transaction can not be broadcasted or it may fail during
          execution. Proceed with caution."
          />
        </>
      ) : null}
      {paymasterEligible ? null : (
        <InsufficientFundsWarning
          address={address}
          transaction={transaction}
          chain={chain}
          networkFeeConfiguration={networkFeeConfiguration}
        />
      )}
    </ZStack>
  );
}
