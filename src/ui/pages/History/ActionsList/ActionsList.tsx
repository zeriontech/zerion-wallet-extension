import React, { useMemo } from 'react';
import groupBy from 'lodash/groupBy';
import { startOfDate } from 'src/shared/units/startOfDate';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { HStack } from 'src/ui/ui-kit/HStack';
import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import { DelayedRender } from 'src/ui/components/DelayedRender';
import { ActionItem } from '../ActionItem';
import { HISTORY_STRETCHY_VIEW_HEIGHT } from '../../Overview/constants';

export function ActionsList({
  actions,
  hasMore,
  isLoading,
  onLoadMore,
}: {
  actions: AnyAddressAction[];
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
    <VStack
      gap={24}
      style={{ minHeight: HISTORY_STRETCHY_VIEW_HEIGHT, alignContent: 'start' }}
    >
      {Object.entries(groupedByDate).map(([timestamp, items]) => (
        <VStack gap={8} key={timestamp}>
          <HStack
            gap={8}
            justifyContent="space-between"
            style={{ paddingInline: 'var(--column-padding-inline)' }}
          >
            <UIText kind="small/accent">
              {new Intl.DateTimeFormat('en', {
                dateStyle: 'medium',
              }).format(Number(timestamp))}
            </UIText>
          </HStack>
          <SurfaceList
            gap={4}
            items={items.map((addressTransaction) => ({
              key: addressTransaction.transaction.hash,
              component: <ActionItem addressAction={addressTransaction} />,
            }))}
          />
        </VStack>
      ))}
      {actions.length && isLoading ? (
        // TODO: fix this  workaround in https://zerion-tech.atlassian.net/browse/WLT-1828
        <div style={{ height: 44 }}>
          <DelayedRender delay={400}>
            <ViewLoading />
          </DelayedRender>
        </div>
      ) : hasMore ? (
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
