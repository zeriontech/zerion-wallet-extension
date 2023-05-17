import React, { useMemo } from 'react';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import type { Chain } from 'src/modules/networks/Chain';
import { usePreferences } from 'src/ui/features/preferences';
import { VStack } from 'src/ui/ui-kit/VStack';
import { NetworkFee } from '../NetworkFee';
import { NonceLine } from '../NonceLine';
import { TotalLine } from '../TotalLine';
import { useTransactionFee } from './useTransactionFee';

const DISPLAY_TOTAL = false;

export interface CustomConfiguration {
  nonce: string | null;
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
  });
  return (
    <VStack gap={8}>
      <NetworkFee transactionFee={transactionFee} />
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
