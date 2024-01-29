import React, { useMemo } from 'react';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import type { Chain } from 'src/modules/networks/Chain';
import { usePreferences } from 'src/ui/features/preferences';
import { VStack } from 'src/ui/ui-kit/VStack';
import { useGasPrices } from 'src/ui/shared/requests/useGasPrices';
import type { CustomConfiguration } from '@zeriontech/transactions/lib/shared/user-configuration/types';
import { NetworkFee } from '../NetworkFee';
import { NonceLine } from '../NonceLine';
import { TotalLine } from '../TotalLine';
import { useTransactionFee } from './useTransactionFee';

const DISPLAY_TOTAL = false;

export function TransactionConfiguration({
  transaction: incomingTransaction,
  from,
  chain,
  onFeeValueCommonReady,
  configuration,
  onConfigurationChange,
  keepPreviousData = false,
}: {
  transaction: IncomingTransaction;
  from: string;
  chain: Chain;
  onFeeValueCommonReady: null | ((value: string) => void);
  configuration: CustomConfiguration;
  onConfigurationChange: null | ((value: CustomConfiguration) => void);
  keepPreviousData?: boolean;
}) {
  const { preferences } = usePreferences();
  const transactionWithFrom = useMemo(
    () => ({ ...incomingTransaction, from }),
    [from, incomingTransaction]
  );
  const { data: chainGasPrices = null } = useGasPrices(chain);
  const transactionFee = useTransactionFee({
    address: from,
    transaction: transactionWithFrom,
    chain,
    onFeeValueCommonReady,
    networkFeeConfiguration: configuration.networkFee,
    keepPreviousData,
    chainGasPrices,
  });
  return (
    <VStack gap={8}>
      <NetworkFee
        transaction={transactionWithFrom}
        transactionFee={transactionFee}
        chain={chain}
        chainGasPrices={chainGasPrices}
        networkFeeConfiguration={configuration.networkFee}
        onChange={
          onConfigurationChange
            ? (networkFee) =>
                onConfigurationChange({ ...configuration, networkFee })
            : null
        }
      />
      {preferences?.configurableNonce ? (
        <NonceLine
          userNonce={configuration.nonce}
          transaction={transactionWithFrom}
          chain={chain}
          onChange={
            onConfigurationChange
              ? (nonce) => onConfigurationChange({ ...configuration, nonce })
              : null
          }
        />
      ) : null}
      {DISPLAY_TOTAL ? <TotalLine transactionFee={transactionFee} /> : null}
    </VStack>
  );
}
