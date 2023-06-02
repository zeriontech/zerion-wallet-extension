import React, { useMemo } from 'react';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import type { Chain } from 'src/modules/networks/Chain';
import { usePreferences } from 'src/ui/features/preferences';
import { VStack } from 'src/ui/ui-kit/VStack';
import { NetworkFee } from '../NetworkFee';
import { NonceLine } from '../NonceLine';
import { TotalLine } from '../TotalLine';
import type { NetworkFeeConfiguration } from '../NetworkFee/types';
import { useTransactionFee } from './useTransactionFee';

const DISPLAY_TOTAL = false;

export interface CustomConfiguration {
  nonce: string | null;
  networkFee: NetworkFeeConfiguration;
}

export function TransactionConfiguration({
  transaction: incomingTransaction,
  from,
  chain,
  onFeeValueCommonReady,
  configuration,
  onConfigurationChange,
}: {
  transaction: IncomingTransaction;
  from: string;
  chain: Chain;
  onFeeValueCommonReady: (value: string) => void;
  configuration: CustomConfiguration;
  onConfigurationChange: (value: CustomConfiguration) => void;
}) {
  const { preferences } = usePreferences();
  const transactionWithFrom = useMemo(
    () => ({ ...incomingTransaction, from }),
    [from, incomingTransaction]
  );
  const transactionFee = useTransactionFee({
    transaction: transactionWithFrom,
    chain,
    onFeeValueCommonReady,
    networkFeeConfiguration: configuration.networkFee,
  });
  return (
    <VStack gap={8}>
      <NetworkFee
        transaction={transactionWithFrom}
        transactionFee={transactionFee}
        chain={chain}
        networkFeeConfiguration={configuration.networkFee}
        onChange={(networkFee) =>
          onConfigurationChange({ ...configuration, networkFee })
        }
      />
      {preferences?.configurableNonce ? (
        <NonceLine
          userNonce={configuration.nonce}
          transaction={transactionWithFrom}
          chain={chain}
          onChange={(nonce) =>
            onConfigurationChange({ ...configuration, nonce })
          }
        />
      ) : null}
      {DISPLAY_TOTAL ? <TotalLine transactionFee={transactionFee} /> : null}
    </VStack>
  );
}
