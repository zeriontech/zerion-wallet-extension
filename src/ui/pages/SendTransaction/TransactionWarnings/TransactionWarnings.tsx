import React from 'react';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import type { Chain } from 'src/modules/networks/Chain';
import type { IncomingAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import type { AddressAction } from 'defi-sdk';
import type { NetworkFeeConfiguration } from '../NetworkFee/types';
import { InsufficientFundsWarning } from './InsufficientFundsWarning';
import { TransactionMayFailWarning } from './TransactionMayFailWarning';

export function TransactionWarnings({
  address,
  transaction,
  addressAction,
  chain,
  networkFeeConfiguration,
}: {
  address: string;
  transaction: IncomingTransaction;
  addressAction: AddressAction | IncomingAddressAction;
  chain: Chain;
  networkFeeConfiguration: NetworkFeeConfiguration;
}) {
  // TODO: Render interpretation warnings
  return (
    <>
      {addressAction.transaction.status === 'failed' ? (
        <TransactionMayFailWarning />
      ) : null}
      <InsufficientFundsWarning
        address={address}
        transaction={transaction}
        chain={chain}
        networkFeeConfiguration={networkFeeConfiguration}
      />
    </>
  );
}
