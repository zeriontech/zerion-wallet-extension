import React from 'react';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import type { Chain } from 'src/modules/networks/Chain';
import type { NetworkFeeConfiguration } from '../NetworkFee/types';
import {
  InsufficientFundsWarning,
  useInsufficientFundsWarning,
} from './InsufficientFundsWarning';

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
  const isInsufficientFundsWarning = useInsufficientFundsWarning({
    address,
    transaction,
    chain,
    networkFeeConfiguration,
  });

  return isInsufficientFundsWarning ? (
    <>
      <InsufficientFundsWarning chain={chain} />
      <Spacer height={16} />
    </>
  ) : null;
}
