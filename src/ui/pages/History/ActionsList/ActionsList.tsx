import React, { useMemo } from 'react';
import groupBy from 'lodash/groupBy';
import { startOfDate } from 'src/shared/units/startOfDate';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import { isLocalAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import { usePreferences } from 'src/ui/features/preferences';
import dayjs from 'dayjs';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { ActionItem } from '../ActionItem';
import { HistoryDaySelector } from '../HistoryDaySelector';
import * as styles from '../HistoryDaySelector/styles.module.css';

const TODAY = new Date();
const FIRST_DATE = new Date('2018-01-01');

export function ActionsList({
  actions,
  hasMore,
  isLoading,
  onLoadMore,
  targetDate: rawTargetDate,
  onChangeDate,
}: {
  actions: AnyAddressAction[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore?(): void;
  targetDate: string | null;
  onChangeDate(date: Date | null): void;
}) {
  const { preferences } = usePreferences();
  const groupedByDate = useMemo(
    () =>
      groupBy(actions, (item) =>
        startOfDate(new Date(item.timestamp).getTime() || Date.now()).getTime()
      ),
    [actions]
  );

  const targetDate = useMemo(() => {
    const result = rawTargetDate ? new Date(rawTargetDate) : null;
    return result;
  }, [rawTargetDate]);

  const emptyTargetDay = useMemo(() => {
    if (!targetDate) {
      return false;
    }
    const firstGroupTimestamp = Object.entries(groupedByDate)[0]?.[0];
    if (!firstGroupTimestamp) {
      return false;
    }
    const target = dayjs(targetDate);
    const firstDay = dayjs(Number(firstGroupTimestamp));
    return target.isAfter(firstDay, 'day');
  }, [groupedByDate, targetDate]);

  return (
    <VStack gap={4} style={{ alignContent: 'start' }}>
      <VStack gap={24}>
        {emptyTargetDay && targetDate && !isLoading ? (
          <VStack gap={8}>
            <HStack gap={12} alignItems="center">
              <div style={{ display: 'flex', paddingLeft: 8 }}>
                <HistoryDaySelector
                  trigger={
                    <UIText kind="small/accent">
                      {new Intl.DateTimeFormat('en', {
                        dateStyle: 'medium',
                      }).format(targetDate)}{' '}
                    </UIText>
                  }
                  style={{
                    display: 'flex',
                    padding: '4px 8px',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                  className={styles.triggerButton}
                  selectedDate={targetDate}
                  maxDate={TODAY}
                  minDate={FIRST_DATE}
                  onDateSelect={onChangeDate}
                />
              </div>
              <Button
                kind="text-primary"
                onClick={() => onChangeDate(null)}
                style={{
                  ['--button-text' as string]: 'var(--primary)',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                }}
              >
                Show Latest Actions
              </Button>
            </HStack>
            <UIText
              kind="small/regular"
              color="var(--neutral-700)"
              style={{
                padding: '12px 16px',
                marginInline: 16,
                borderRadius: 8,
                backgroundColor: 'var(--neutral-100)',
              }}
            >
              No transactions found for this day.
            </UIText>
          </VStack>
        ) : null}
        {Object.entries(groupedByDate).map(([timestamp, items], index) => (
          <VStack gap={8} key={timestamp}>
            <HStack gap={12} alignItems="center">
              <div style={{ display: 'flex', paddingLeft: 8 }}>
                <HistoryDaySelector
                  trigger={
                    <UIText kind="small/accent">
                      {new Intl.DateTimeFormat('en', {
                        dateStyle: 'medium',
                      }).format(Number(timestamp))}{' '}
                    </UIText>
                  }
                  style={{
                    display: 'flex',
                    padding: '4px 8px',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                  className={styles.triggerButton}
                  selectedDate={targetDate || undefined}
                  maxDate={TODAY}
                  minDate={FIRST_DATE}
                  onDateSelect={onChangeDate}
                />
              </div>
              {!emptyTargetDay && targetDate && index === 0 && !isLoading ? (
                <Button
                  kind="text-primary"
                  onClick={() => onChangeDate(null)}
                  style={{
                    ['--button-text' as string]: 'var(--primary)',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                  }}
                >
                  Show Latest Actions
                </Button>
              ) : null}
            </HStack>

            <SurfaceList
              gap={4}
              items={items.map((addressAction) => {
                const hash =
                  addressAction.transaction?.hash ||
                  addressAction.acts?.at(0)?.transaction.hash ||
                  '';
                return {
                  key: isLocalAddressAction(addressAction)
                    ? `local-${addressAction.relatedTransaction || hash}`
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
          style={{ paddingBlock: 6 }}
          items={[
            {
              key: 0,
              onClick: isLoading ? undefined : onLoadMore,
              style: { height: 40 },
              component: isLoading ? (
                <ViewLoading />
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
