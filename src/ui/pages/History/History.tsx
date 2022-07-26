import { AddressTransaction, useSubscription } from 'defi-sdk';
import React, { useMemo } from 'react';
import { useQuery } from 'react-query';
import { toAddressTransaction } from 'src/modules/ethereum/transactions/model';
import { Background } from 'src/ui/components/Background';
import { FillView } from 'src/ui/components/FillView';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { useLocalAddressTransactions } from 'src/ui/transactions/useLocalAddressTransactions';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { TransactionsList } from './TransactionsList';

function useMinedAndPendingAddressTransactions() {
  const { params, ready } = useAddressParams();
  const localTransactions = useLocalAddressTransactions(params);

  const { data: localAddressTransactions, ...localTransactionsQuery } =
    useQuery(
      'pages/history',
      () => {
        return Promise.all(
          localTransactions.map((transactionObject) =>
            toAddressTransaction(transactionObject)
          )
        );
      },
      { useErrorBoundary: true }
    );

  const { value } = useSubscription<
    AddressTransaction[],
    'address',
    'transactions'
  >({
    enabled: ready,
    namespace: 'address',
    body: useMemo(
      () => ({
        scope: ['transactions'],
        payload: {
          ...params,
          currency: 'usd',
          transactions_limit: 50,
          transactions_offset: 0,
        },
      }),
      [params]
    ),
  });
  return {
    data: localAddressTransactions
      ? localAddressTransactions.concat(value || [])
      : null,
    ...localTransactionsQuery,
  };
}

export function History() {
  const { data: transactions, isLoading } =
    useMinedAndPendingAddressTransactions();

  if (isLoading || !transactions) {
    return null;
  }

  return (
    <Background backgroundColor="var(--background)">
      <PageColumn>
        {transactions.length === 0 ? (
          <FillView>
            <UIText kind="h/5_reg" color="var(--neutral-500)">
              Empty State
            </UIText>
          </FillView>
        ) : (
          <>
            <PageTop />
            <VStack gap={24}>
              <TransactionsList transactions={transactions} />
              <Spacer height={32} />
            </VStack>
          </>
        )}
      </PageColumn>
    </Background>
  );
}
