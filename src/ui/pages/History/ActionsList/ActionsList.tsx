import React, { useMemo } from 'react';
import groupBy from 'lodash/groupBy';
import type { AddressAction } from 'defi-sdk';
import { startOfDate } from 'src/shared/units/startOfDate';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { HStack } from 'src/ui/ui-kit/HStack';
import { PendingAction } from 'src/modules/ethereum/transactions/model';
import { ActionItem } from '../ActionItem';

export function ActionsList({
  actions,
  hasMore,
  isLoading,
  onLoadMore,
}: {
  actions: (AddressAction | PendingAction)[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore?(): void;
}) {
  const groupedByDate = useMemo(
    () =>
      groupBy(actions, (item) =>
        startOfDate(new Date(item.datetime || Date.now()).getTime()).getTime()
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
      {hasMore ? (
        <SurfaceList
          items={[
            {
              key: 0,
              onClick: onLoadMore,
              component: (
                <HStack gap={8} alignItems="center">
                  <span style={{ color: 'var(--primary)' }}>
                    More transactions
                  </span>
                  {isLoading ? (
                    <CircleSpinner style={{ display: 'inline-block' }} />
                  ) : null}
                </HStack>
              ),
            },
          ]}
        />
      ) : null}
    </VStack>
  );
}
