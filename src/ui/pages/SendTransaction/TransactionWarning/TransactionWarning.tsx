import React from 'react';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import type { Chain } from 'src/modules/networks/Chain';
import type { NetworkFeeConfiguration } from '../NetworkFee/types';
import { InsufficientFundsWarning } from './InsufficientFundsWarning';

export function TransactionWarning({
  address,
  transaction,
  chain,
  networkFeeConfiguration,
}: {
  address: string;
  transaction: IncomingTransaction;
  chain: Chain;
  networkFeeConfiguration: NetworkFeeConfiguration;
}) {
  return (
    <InsufficientFundsWarning
      address={address}
      transaction={transaction}
      chain={chain}
      networkFeeConfiguration={networkFeeConfiguration}
    />
  );
}
