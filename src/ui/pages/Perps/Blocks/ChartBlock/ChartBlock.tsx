import React, { useMemo, useState } from 'react';
import { useCandleSnapshot } from 'src/modules/hyperliquid/hooks/useCandleSnapshot';
import {
  DEFAULT_PERP_INTERVAL,
  PERP_INTERVALS,
  getIntervalRange,
  intervalLabel,
} from 'src/modules/hyperliquid/intervalRanges';
import type { PerpCandleInterval } from 'src/modules/hyperliquid/api/requests/perp-candle-snapshot.types';
import type { PerpFill } from 'src/modules/hyperliquid/api/requests/perp-user-fills.types';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import { CandleChart } from './CandleChart';

const CHART_HEIGHT = 252;

export function ChartBlock({
  coin,
  fills,
  displayName,
}: {
  coin: string;
  fills: PerpFill[];
  displayName: string;
}) {
  const [interval, setIntervalValue] = useState<PerpCandleInterval>(
    DEFAULT_PERP_INTERVAL
  );
  const range = useMemo(() => getIntervalRange(interval), [interval]);

  const { data, isLoading, isError } = useCandleSnapshot({
    coin,
    interval,
    startTime: range.startTime,
    endTime: range.endTime,
  });

  const candles = data ?? [];

  return (
    <VStack gap={12}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: CHART_HEIGHT,
          borderRadius: 16,
          backgroundColor: 'var(--neutral-100)',
          overflow: 'hidden',
        }}
      >
        {isError ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <UIText kind="caption/regular" color="var(--neutral-600)">
              Couldn’t load chart
            </UIText>
          </div>
        ) : isLoading || candles.length === 0 ? null : (
          <CandleChart
            candles={candles}
            height={CHART_HEIGHT}
            interval={interval}
            coin={coin}
            fills={fills}
            displayName={displayName}
          />
        )}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <HStack gap={4}>
          {PERP_INTERVALS.map((iv) => {
            const active = iv === interval;
            return (
              <UnstyledButton
                key={iv}
                type="button"
                onClick={() => setIntervalValue(iv)}
                style={{
                  cursor: 'pointer',
                  padding: '6px 12px',
                  borderRadius: 4,
                  transition: 'background-color 0.15s ease',
                  backgroundColor: active
                    ? 'var(--neutral-200)'
                    : 'transparent',
                  color: active ? 'var(--neutral-800)' : 'var(--neutral-600)',
                }}
              >
                <UIText kind="caption/accent">{intervalLabel(iv)}</UIText>
              </UnstyledButton>
            );
          })}
        </HStack>
      </div>
    </VStack>
  );
}

export function ChartBlockSkeleton() {
  return (
    <VStack gap={12}>
      <div
        style={{
          width: '100%',
          height: CHART_HEIGHT,
          borderRadius: 16,
          backgroundColor: 'var(--neutral-200)',
        }}
      />
      <HStack gap={4}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 36,
              height: 28,
              borderRadius: 4,
              backgroundColor: 'var(--neutral-200)',
            }}
          />
        ))}
      </HStack>
    </VStack>
  );
}
