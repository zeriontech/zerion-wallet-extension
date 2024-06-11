import React, { useMemo } from 'react';
import type { CustomConfiguration } from '@zeriontech/transactions';
import type {
  IncomingTransaction,
  IncomingTransactionWithFrom,
} from 'src/modules/ethereum/types/IncomingTransaction';
import type { Chain } from 'src/modules/networks/Chain';
import { usePreferences } from 'src/ui/features/preferences';
import { VStack } from 'src/ui/ui-kit/VStack';
import { useGasPrices } from 'src/ui/shared/requests/useGasPrices';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { NetworkFee } from '../NetworkFee';
import { NonceLine } from '../NonceLine';
import { useTransactionFee } from './useTransactionFee';

function NetworkFeeLine({
  transaction,
  chain,
  onFeeValueCommonReady,
  configuration,
  onConfigurationChange,
  keepPreviousData = false,
}: {
  transaction: IncomingTransactionWithFrom;
  chain: Chain;
  onFeeValueCommonReady: null | ((value: string) => void);
  configuration: CustomConfiguration;
  onConfigurationChange: null | ((value: CustomConfiguration) => void);
  keepPreviousData?: boolean;
}) {
  const { data: chainGasPrices = null } = useGasPrices(chain, {
    suspense: true,
  });
  const transactionFee = useTransactionFee({
    address: transaction.from,
    transaction,
    chain,
    onFeeValueCommonReady,
    networkFeeConfiguration: configuration.networkFee,
    keepPreviousData,
    chainGasPrices,
  });

  return (
    <NetworkFee
      transaction={transaction}
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
  );
}
export function TransactionConfiguration({
  transaction: incomingTransaction,
  from,
  chain,
  onFeeValueCommonReady,
  configuration,
  onConfigurationChange,
  paymasterEligible,
  keepPreviousData = false,
}: {
  transaction: IncomingTransaction;
  from: string;
  chain: Chain;
  onFeeValueCommonReady: null | ((value: string) => void);
  configuration: CustomConfiguration;
  onConfigurationChange: null | ((value: CustomConfiguration) => void);
  paymasterEligible: boolean;
  keepPreviousData?: boolean;
}) {
  const { preferences } = usePreferences();
  const transactionWithFrom = useMemo(
    () => ({ ...incomingTransaction, from }),
    [from, incomingTransaction]
  );
  return (
    <VStack gap={8}>
      {paymasterEligible ? (
        <HStack gap={8} justifyContent="space-between">
          <UIText kind="small/regular" color="var(--neutral-700)">
            Network Fee
          </UIText>
          <UIText
            kind="small/accent"
            style={{
              background: 'linear-gradient(90deg, #6C6CF9 0%, #FF7583 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Free
          </UIText>
        </HStack>
      ) : (
        <NetworkFeeLine
          configuration={configuration}
          onConfigurationChange={onConfigurationChange}
          transaction={transactionWithFrom}
          chain={chain}
          keepPreviousData={keepPreviousData}
          onFeeValueCommonReady={onFeeValueCommonReady}
        />
      )}
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
    </VStack>
  );
}
