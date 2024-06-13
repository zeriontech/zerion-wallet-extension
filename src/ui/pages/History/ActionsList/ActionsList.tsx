import React, { useMemo } from 'react';
import groupBy from 'lodash/groupBy';
import { startOfDate } from 'src/shared/units/startOfDate';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { HStack } from 'src/ui/ui-kit/HStack';
import {
  isLocalAddressAction,
  type AnyAddressAction,
} from 'src/modules/ethereum/transactions/addressAction';
import { DelayedRender } from 'src/ui/components/DelayedRender';
import { usePreferences } from 'src/ui/features/preferences';
import { ActionItem } from '../ActionItem';

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
  const { preferences } = usePreferences();
  const groupedByDate = useMemo(
    () =>
      groupBy(actions, (item) =>
        startOfDate(new Date(item.datetime).getTime() || Date.now()).getTime()
      ),
    [actions]
  );
  return (
    <VStack gap={4} style={{ alignContent: 'start' }}>
      <VStack gap={24}>
        {Object.entries(groupedByDate).map(([timestamp, items]) => (
          <VStack gap={8} key={timestamp}>
            <HStack
              gap={8}
              justifyContent="space-between"
              style={{ paddingInline: 16 }}
            >
              <UIText kind="small/accent">
                {new Intl.DateTimeFormat('en', {
                  dateStyle: 'medium',
                }).format(Number(timestamp))}{' '}
              </UIText>
            </HStack>
            <SurfaceList
              gap={4}
              items={items.map((addressAction) => {
                const hash = addressAction.transaction.hash;
                return {
                  key: isLocalAddressAction(addressAction)
                    ? addressAction.relatedTransaction || hash
                    : hash,
                  component: (
                    <ActionItem
                      addressAction={addressAction}
                      testnetMode={Boolean(preferences?.testnetMode?.on)}
                    />
                  ),
                };
              })}
            />
          </VStack>
        ))}
      </VStack>
      {actions.length && (isLoading || hasMore) ? (
        <SurfaceList
          items={[
            {
              key: 0,
              onClick: isLoading ? undefined : onLoadMore,
              style: { height: 40 },
              component: isLoading ? (
                <DelayedRender delay={400}>
                  <ViewLoading />
                </DelayedRender>
              ) : (
                <UIText kind="body/accent" color="var(--primary)">
                  Show More
                </UIText>
              ),
            },
          ]}
        />
      ) : null}
    </VStack>
  );
}
