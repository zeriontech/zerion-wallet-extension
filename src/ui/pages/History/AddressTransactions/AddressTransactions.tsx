import { useSubscription, DataStatus } from 'defi-sdk';
import groupBy from 'lodash/groupBy';
import type { AddressTransaction } from 'defi-sdk';
import React, { useMemo } from 'react';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { TransactionItem } from '../TransactionItem';
import { startOfDate } from 'src/shared/units/startOfDate';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';

export function AddressTransactions() {
  const { params, ready } = useAddressParams();
  const { value, status } = useSubscription<
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
  const groupedByDate = useMemo(
    () =>
      value
        ? groupBy(value, (item) =>
            startOfDate(item.mined_at * 1000 || 0).getTime()
          )
        : null,
    [value]
  );
  if (status === DataStatus.error) {
    throw new Error('Could not fetch Address Transactions');
  }

  if (!groupedByDate) {
    return null;
  }
  console.log('AddressTransactions', value);

  return (
    <>
      {Object.entries(groupedByDate).map(([timestamp, items]) => (
        <VStack gap={12} key={timestamp}>
          <UIText kind="subtitle/l_med">
            {new Intl.DateTimeFormat('en', {
              dateStyle: 'medium',
            }).format(Number(timestamp))}
          </UIText>
          <SurfaceList
            items={items.map((addressTransaction) => ({
              key: addressTransaction.hash,
              component: (
                <TransactionItem addressTransaction={addressTransaction} />
              ),
            }))}
          />
        </VStack>
      ))}
    </>
  );
}
