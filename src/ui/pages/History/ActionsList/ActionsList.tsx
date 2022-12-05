import React, { useMemo } from 'react';
import groupBy from 'lodash/groupBy';
import type { AddressAction } from 'defi-sdk';
import { startOfDate } from 'src/shared/units/startOfDate';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import type { PendingAddressAction } from 'src/modules/ethereum/transactions/model';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { ActionItem } from '../ActionItem';

export function ActionsList({
  actions,
  hasMore,
  isLoading,
  onLoadMore,
}: {
  actions: (AddressAction | PendingAddressAction)[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore?(): void;
}) {
  const groupedByDate = useMemo(
    () =>
      groupBy(actions, (item) =>
        startOfDate(new Date(item.datetime).getTime() || Date.now()).getTime()
      ),
    [actions]
  );
  return (
    <VStack gap={24}>
      {Object.entries(groupedByDate).map(([timestamp, items]) => (
        <VStack gap={12} key={timestamp}>
          <UIText kind="subtitle/l_med">
            {new Intl.DateTimeFormat('en', {
              dateStyle: 'medium',
            }).format(Number(timestamp))}
          </UIText>
          <SurfaceList
            items={items.map((addressTransaction) => ({
              key: addressTransaction.transaction.hash,
              component: <ActionItem addressAction={addressTransaction} />,
            }))}
          />
        </VStack>
      ))}
      {isLoading && <ViewLoading />}
      {hasMore ? (
        <SurfaceList
          items={[
            {
              key: 0,
              onClick: isLoading ? undefined : onLoadMore,
              component: (
                <span
                  style={{
                    color: isLoading ? 'var(--neutral-500)' : 'var(--primary)',
                  }}
                >
                  More transactions
                </span>
              ),
            },
          ]}
        />
      ) : null}
    </VStack>
  );
}
