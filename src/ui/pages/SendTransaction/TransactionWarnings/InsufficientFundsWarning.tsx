import React from 'react';
import type { NetworkFeeConfiguration } from '@zeriontech/transactions';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import { createChain } from 'src/modules/networks/Chain';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { useGasPrices } from 'src/ui/shared/requests/useGasPrices';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { useTransactionFee } from '../TransactionConfiguration/useTransactionFee';
import { TransactionWarning } from './TransactionWarning';

function useInsufficientFundsWarning({
  address,
  transaction,
  network,
  networkFeeConfiguration,
}: {
  address: string;
  transaction: IncomingTransaction;
  network: NetworkConfig;
  networkFeeConfiguration: NetworkFeeConfiguration;
}) {
  const chain = createChain(network.id);
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
  network,
  networkFeeConfiguration,
}: {
  address: string;
  transaction: IncomingTransaction;
  network: NetworkConfig;
  networkFeeConfiguration: NetworkFeeConfiguration;
}) {
  const { networks } = useNetworks();

  const isInsufficientFundsWarning = useInsufficientFundsWarning({
    address,
    transaction,
    network,
    networkFeeConfiguration,
  });

  if (!networks || !isInsufficientFundsWarning) {
    return null;
  }

  return (
    <TransactionWarning
      title="Insufficient balance"
      message={`You don't have enough ${
        network.native_asset?.symbol || 'native token'
      } to cover network fees`}
    />
  );
}
