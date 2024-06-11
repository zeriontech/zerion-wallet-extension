import React from 'react';
import type { NetworkFeeConfiguration } from '@zeriontech/transactions';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import type { Chain } from 'src/modules/networks/Chain';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { useGasPrices } from 'src/ui/shared/requests/useGasPrices';
import { useTransactionFee } from '../TransactionConfiguration/useTransactionFee';
import { TransactionWarning } from './TransactionWarning';

function useInsufficientFundsWarning({
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
  const { data: chainGasPrices = null } = useGasPrices(chain, {
    suspense: true,
  });
  const transactionFee = useTransactionFee({
    address,
    transaction,
    chain,
    networkFeeConfiguration,
    chainGasPrices,
    onFeeValueCommonReady: null,
  });

  return transactionFee.costs?.totalValueExceedsBalance ?? false;
}

export function InsufficientFundsWarning({
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
  const { networks } = useNetworks();

  const isInsufficientFundsWarning = useInsufficientFundsWarning({
    address,
    transaction,
    chain,
    networkFeeConfiguration,
  });

  if (!networks || !isInsufficientFundsWarning) {
    return null;
  }

  return (
    <TransactionWarning
      title="Insufficient balance"
      message={`You don't have enough ${
        networks?.getNetworkByName(chain)?.native_asset?.symbol ||
        'native token'
      } to cover network fees`}
    />
  );
}
