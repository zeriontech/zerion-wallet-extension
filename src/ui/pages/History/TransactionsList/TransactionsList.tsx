import React, { useMemo } from 'react';
import groupBy from 'lodash/groupBy';
import { startOfDate } from 'src/shared/units/startOfDate';
import type { PartialAddressTransaction } from 'src/modules/ethereum/transactions/model';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { TransactionItem } from '../TransactionItem';

export function TransactionsList({
  transactions,
}: {
  transactions: PartialAddressTransaction[];
}) {
  console.log(transactions);
  const groupedByDate = useMemo(
    () =>
      groupBy(transactions, (item) =>
        startOfDate(item.mined_at * 1000 || 0).getTime()
      ),
    [transactions]
  );
  return (
    <>
      {Object.entries(groupedByDate).map(([timestamp, items]) => (
        <VStack gap={12} key={timestamp}>
          <UIText kind="subtitle/l_med">
            {new Intl.DateTimeFormat('en', {
              dateStyle: 'medium',
            }).format(Number(timestamp) * 1000)}
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
