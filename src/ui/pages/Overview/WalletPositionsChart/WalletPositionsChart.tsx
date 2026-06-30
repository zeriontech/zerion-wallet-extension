import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useStore } from '@store-unit/react';
import WalletIcon from 'jsx:src/ui/assets/wallet-fancy.svg';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useWalletChart } from 'src/modules/zerion-api/hooks/useWalletChart';
import type { ChartPeriod } from 'src/modules/zerion-api/requests/asset-get-chart';
import { type Theme, themeStore } from 'src/ui/features/appearance';
import { preferenceStore } from 'src/ui/features/appearance/preference-store';
import { BlurrableBalance } from 'src/ui/components/BlurrableBalance';
import { Chart } from 'src/ui/components/chart/Chart';
import { CHART_HEIGHT } from 'src/ui/components/chart/config';
import {
  drawDotPlugin,
  drawVerticalLinePlugin,
} from 'src/ui/components/chart/plugins';
import type {
  ChartInteraction,
  ChartPlugins,
} from 'src/ui/components/chart/types';
import { Button } from 'src/ui/ui-kit/Button';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { NBSP } from 'src/ui/shared/typography';
import {
  computeChartRangeDisplay,
  type WalletChartPoint,
} from './computeChartRangeDisplay';

const CHART_TYPE_OPTIONS: ChartPeriod[] = ['1h', '1d', '1w', '1m', '1y', 'max'];
const CHART_TYPE_LABELS: Record<ChartPeriod, string> = {
  '1h': '1H',
  '1d': '1D',
  '1w': '1W',
  '1m': '1M',
  '1y': '1Y',
  max: 'Max',
};

function SkeletonBar({
  width,
  height,
  borderRadius = 8,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: 'var(--neutral-100)',
      }}
    />
  );
}

/**
 * Pixel-precise placeholder matching the loaded layout so opening the dialog
 * doesn't jump while the first request is in flight. Heights mirror the real
 * components: headline/h1 (36), body/accent (24), CHART_HEIGHT, and the
 * 32px period buttons. Rendered as a fragment so the rows participate in the
 * outer VStack's gap.
 */
function ChartSkeleton() {
  return (
    <>
      <VStack gap={0} style={{ justifyItems: 'start' }}>
        <div style={{ height: 36, display: 'flex', alignItems: 'center' }}>
          <SkeletonBar width={160} height={28} />
        </div>
        <div style={{ height: 24, display: 'flex', alignItems: 'center' }}>
          <SkeletonBar width={96} height={16} borderRadius={6} />
        </div>
      </VStack>
      {/* Match the real chart, which bleeds to the dialog's left/right edges. */}
      <div style={{ marginInline: -16 }}>
        <SkeletonBar width="100%" height={CHART_HEIGHT} borderRadius={12} />
      </div>
      <HStack gap={8} justifyContent="space-between" alignItems="center">
        {CHART_TYPE_OPTIONS.map((type) => (
          <SkeletonBar key={type} width={44} height={32} />
        ))}
      </HStack>
    </>
  );
}

export function WalletPositionsChart({ address }: { address: string }) {
  const { currency } = useCurrency();
  const { theme } = useStore(themeStore);
  const { hideBalances } = useStore(preferenceStore);

  const themeRef = useRef<Theme>(theme);
  themeRef.current = theme;

  // Match the asset-info chart hover: the active point follows the cursor's
  // x-position even when not over the line, with a vertical guide line + dot.
  const interaction = useMemo<ChartInteraction>(
    () => ({ mode: 'index', intersect: false, axis: 'x' }),
    []
  );
  const plugins = useMemo<ChartPlugins>(
    () => [
      drawVerticalLinePlugin({ getTheme: () => themeRef.current }),
      drawDotPlugin({ getTheme: () => themeRef.current }),
    ],
    []
  );

  const balanceElementRef = useRef<HTMLDivElement>(null);
  const changeElementRef = useRef<HTMLDivElement>(null);
  const dateElementRef = useRef<HTMLDivElement>(null);

  const [period, setPeriod] = useState<ChartPeriod>('1d');

  const {
    data: chartData,
    isFetching,
    isError,
  } = useWalletChart({
    addresses: [address],
    currency,
    period,
  });

  const chartPoints = useMemo<WalletChartPoint[]>(() => {
    return (
      chartData?.data.points.map((item) => [
        item.timestamp * 1000,
        item.value,
        null,
      ]) || []
    );
  }, [chartData]);

  const handleRangeSelect = useCallback(
    ({
      startRangeIndex,
      endRangeIndex,
    }: {
      startRangeIndex: number | null;
      endRangeIndex: number | null;
    }) => {
      const display = computeChartRangeDisplay({
        points: chartPoints,
        startRangeIndex,
        endRangeIndex,
        currency,
        hideBalances,
      });
      // When hide-balances is on, these refs aren't mounted (BlurrableBalance
      // renders a placeholder instead of the children), so the figures can't
      // leak via the live readout.
      if (balanceElementRef.current) {
        balanceElementRef.current.textContent = display.balance ?? '';
      }
      if (changeElementRef.current) {
        changeElementRef.current.textContent = display.change ?? '';
        changeElementRef.current.style.setProperty(
          'color',
          display.changeColor
        );
      }
      if (dateElementRef.current) {
        dateElementRef.current.textContent = display.date;
      }
    },
    [chartPoints, currency, hideBalances]
  );

  useEffect(() => {
    handleRangeSelect({ endRangeIndex: null, startRangeIndex: null });
  }, [chartPoints, handleRangeSelect]);

  // First load only — once we have data, keepPreviousData keeps it across
  // period switches (which surface as per-button spinners instead).
  const showSkeleton = !chartData && !isError;

  return (
    <VStack gap={8} style={{ paddingInline: 16 }}>
      <HStack gap={8} alignItems="center">
        <WalletIcon style={{ width: 24, height: 24 }} />
        <UIText kind="body/accent">Wallet Balance</UIText>
      </HStack>
      {showSkeleton ? <ChartSkeleton /> : null}
      {showSkeleton ? null : (
        <>
          <VStack gap={0} style={{ justifyItems: 'start' }}>
            <BlurrableBalance kind="headline/h1" color="var(--black)">
              <UIText
                kind="headline/h1"
                ref={balanceElementRef}
                style={{
                  // Keep the value on a single line. If it doesn't fit, let it
                  // overflow past the edge rather than wrap or clip with an
                  // ellipsis.
                  whiteSpace: 'nowrap',
                  // Fixed digit widths so the balance doesn't shake while hovering.
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {NBSP}
              </UIText>
            </BlurrableBalance>
            <HStack
              gap={8}
              alignItems="center"
              style={{ minHeight: 24, whiteSpace: 'nowrap' }}
            >
              <BlurrableBalance kind="body/accent" color="var(--black)">
                <UIText
                  kind="body/accent"
                  ref={changeElementRef}
                  // Keep digit widths fixed so the readout doesn't shake as the
                  // value changes while hovering across the chart.
                  style={{
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap',
                  }}
                />
              </BlurrableBalance>
              <UIText
                kind="caption/regular"
                color="var(--neutral-500)"
                ref={dateElementRef}
                style={{ whiteSpace: 'nowrap' }}
              />
            </HStack>
          </VStack>
          {isError ? (
            <UIText
              kind="body/regular"
              color="var(--neutral-500)"
              style={{ paddingBlock: 32, textAlign: 'center' }}
            >
              Couldn’t load the chart. Please try again later.
            </UIText>
          ) : (
            <>
              <Chart
                chartPoints={chartPoints}
                onRangeSelect={handleRangeSelect}
                theme={theme}
                currency={currency}
                interaction={interaction}
                plugins={plugins}
                showValueLabels={!hideBalances}
                // Bleed the chart to the dialog's left/right edges while the
                // rest of the column keeps its 16px padding.
                style={{ width: 'calc(100% + 32px)', marginInline: -16 }}
              />
              <HStack
                gap={8}
                justifyContent="space-between"
                alignItems="center"
              >
                {CHART_TYPE_OPTIONS.map((type) => (
                  <Button
                    key={type}
                    kind="neutral"
                    size={32}
                    style={{
                      width: 44,
                      padding: '0 8px',
                      ['--button-background' as string]:
                        type === period ? 'var(--neutral-200)' : 'var(--white)',
                      ['--button-background-hover' as string]:
                        type === period
                          ? 'var(--neutral-300)'
                          : 'var(--neutral-100)',
                    }}
                    onClick={() => setPeriod(type)}
                  >
                    {type === period && isFetching ? (
                      <CircleSpinner style={{ marginInline: 'auto' }} />
                    ) : (
                      <UIText kind="caption/accent" color="var(--neutral-700)">
                        {CHART_TYPE_LABELS[type]}
                      </UIText>
                    )}
                  </Button>
                ))}
              </HStack>
            </>
          )}
        </>
      )}
    </VStack>
  );
}
