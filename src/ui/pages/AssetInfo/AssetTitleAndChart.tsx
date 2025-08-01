import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import dayjs from 'dayjs';
import { useCurrency } from 'src/modules/currency/useCurrency';
import type { Asset } from 'src/modules/zerion-api/requests/asset-get-fungible-full-info';
import { formatPercent } from 'src/shared/units/formatPercent';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import { formatPriceValue } from 'src/shared/units/formatPriceValue';
import { useAssetChart } from 'src/modules/zerion-api/hooks/useAssetChart';
import type {
  AssetChartActions,
  ChartPeriod,
} from 'src/modules/zerion-api/requests/asset-get-chart';
import { Button } from 'src/ui/ui-kit/Button';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import BigNumber from 'bignumber.js';
import { usePreferences } from 'src/ui/features/preferences';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { Toggle } from 'src/ui/ui-kit/Toggle';
import SettingsSlidersIcon from 'jsx:src/ui/assets/settings-sliders.svg';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import { getColor, getSign } from './helpers';
import { AssetChart } from './AssetChart/AssetChart';
import type { AssetChartPoint } from './AssetChart/types';

const CHART_TYPE_OPTIONS: ChartPeriod[] = ['1h', '1d', '1w', '1m', '1y', 'max'];
const CHART_TYPE_LABELS: Record<ChartPeriod, string> = {
  '1h': '1H',
  '1d': '1D',
  '1w': '1W',
  '1m': '1M',
  '1y': '1Y',
  max: 'Max',
};

const REQUEST_TOKEN_LINK = 'https://zerion.io/request-token';

function populateChartActionsDirection(
  actions: AssetChartActions | null
): AssetChartActions | null {
  if (!actions || actions.total.direction) {
    return actions;
  }
  const quantity = new BigNumber(actions.total.quantity);
  return {
    ...actions,
    total: {
      ...actions.total,
      direction: quantity.gt(0) ? 'in' : quantity.lt(0) ? 'out' : null,
    },
  };
}

export function AssetTitleAndChart({
  asset,
  address,
}: {
  asset: Asset;
  address: string;
}) {
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);
  const { currency } = useCurrency();
  const { preferences, setPreferences } = usePreferences();
  const isUntrackedAsset = asset.meta.price == null;
  const priceElementRef = useRef<HTMLDivElement>(null);
  const priceChangeElementRef = useRef<HTMLDivElement>(null);
  const dateElementRef = useRef<HTMLDivElement>(null);
  const [period, setPeriod] = useState<ChartPeriod>('1d');
  const {
    data: chartData,
    isFetching,
    isError,
  } = useAssetChart({
    addresses: [address],
    currency,
    fungibleId: asset.id,
    period,
  });

  const chartPoints = useMemo<AssetChartPoint[]>(() => {
    return (
      chartData?.data.points.map((item) => [
        item.timestamp * 1000,
        item.value,
        preferences?.showTransactionsOnAssetChart
          ? populateChartActionsDirection(item.actions)
          : null,
      ]) || []
    );
  }, [chartData, preferences?.showTransactionsOnAssetChart]);

  const handleRangeSelect = useCallback(
    ({
      startRangeIndex,
      endRangeIndex,
    }: {
      startRangeIndex: number | null;
      endRangeIndex: number | null;
    }) => {
      const startTimestamp =
        startRangeIndex != null
          ? chartPoints[startRangeIndex]?.[0]
          : chartPoints[0]?.[0];
      const startValue =
        startRangeIndex != null
          ? chartPoints[startRangeIndex]?.[1]
          : chartPoints[0]?.[1];

      const value =
        endRangeIndex != null
          ? chartPoints[endRangeIndex]?.[1]
          : asset.meta.price;
      const timestamp =
        endRangeIndex != null ? chartPoints[endRangeIndex]?.[0] : 0;

      const localPriceChange = startValue
        ? (((value || 0) - startValue) / startValue) * 100
        : 0;
      if (
        priceElementRef.current &&
        priceChangeElementRef.current &&
        dateElementRef.current
      ) {
        const priceValue = formatPriceValue(value || 0, 'en', currency);
        priceElementRef.current.textContent = priceValue;
        priceChangeElementRef.current.style.setProperty(
          'color',
          getColor(localPriceChange)
        );
        priceChangeElementRef.current.textContent = `${getSign(
          localPriceChange
        )}${formatPercent(Math.abs(localPriceChange), 'en')}%`;

        const activeTimestampFormatted = timestamp
          ? dayjs(timestamp).format('MMM D, YYYY, HH:mm')
          : null;
        const initialTimestampFormatted =
          startTimestamp !== chartPoints[0]?.[0]
            ? `${dayjs(startTimestamp).format('MMM D, YYYY, HH:mm')} → `
            : '';

        dateElementRef.current.textContent = timestamp
          ? `${initialTimestampFormatted}${activeTimestampFormatted}`
          : '';
      }
    },
    [chartPoints, currency, asset.meta.price]
  );

  useEffect(() => {
    handleRangeSelect({ endRangeIndex: null, startRangeIndex: null });
  }, [chartPoints, handleRangeSelect]);

  return (
    <>
      <VStack gap={16}>
        <VStack gap={12}>
          {isUntrackedAsset ? (
            <VStack gap={0}>
              <UIText kind="headline/hero">Price Not Tracked</UIText>
              <UIText kind="body/regular">
                <TextAnchor
                  href={REQUEST_TOKEN_LINK}
                  rel="noopener noreferrer"
                  target="_blank"
                  style={{ color: 'var(--primary)', cursor: 'pointer' }}
                >
                  Let us know
                </TextAnchor>{' '}
                if you’d like to see it on Zerion
              </UIText>
            </VStack>
          ) : (
            <VStack gap={0}>
              <HStack gap={8} alignItems="end">
                <UIText kind="headline/hero" ref={priceElementRef} />
                <UIText
                  kind="body/accent"
                  style={{ paddingBottom: 4 }}
                  ref={priceChangeElementRef}
                />
              </HStack>
              <UIText
                kind="caption/regular"
                color="var(--neutral-500)"
                ref={dateElementRef}
                style={{ height: 16 }}
              />
            </VStack>
          )}
        </VStack>
        {isUntrackedAsset || isError ? null : (
          <>
            <AssetChart
              asset={asset}
              chartPoints={chartPoints}
              onRangeSelect={handleRangeSelect}
            />
            <HStack gap={8} justifyContent="space-between" alignItems="center">
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
              <Button
                kind="neutral"
                size={32}
                style={{
                  width: 36,
                  padding: '4px 8px',
                  ['--button-background' as string]: 'var(--white)',
                  ['--button-background-hover' as string]: 'var(--neutral-100)',
                }}
                aria-label="Asset Chart Settings"
                onClick={() => {
                  if (dialogRef.current) {
                    dialogRef.current.showModal();
                  }
                }}
              >
                <SettingsSlidersIcon
                  style={{
                    display: 'block',
                    width: 20,
                    height: 20,
                    color: 'var(--neutral-700)',
                  }}
                />
              </Button>
            </HStack>
          </>
        )}
      </VStack>
      <KeyboardShortcut
        combination="shift+T"
        onKeyDown={() => {
          setPreferences({
            showTransactionsOnAssetChart:
              !preferences?.showTransactionsOnAssetChart,
          });
        }}
      />
      <BottomSheetDialog ref={dialogRef} height="min-content">
        <VStack gap={8}>
          <UIText kind="small/accent" color="var(--neutral-500)">
            Asset Chart
          </UIText>
          <HStack
            gap={4}
            justifyContent="space-between"
            style={{
              padding: 12,
              border: '2px solid var(--neutral-200)',
              borderRadius: 12,
            }}
          >
            <HStack gap={8} alignItems="center">
              <UIText kind="body/accent">Transactions on the chart</UIText>
              <UIText
                kind="caption/accent"
                color="var(--neutral-600)"
                style={{
                  background: 'var(--neutral-200)',
                  padding: '2px 4px',
                  borderRadius: 8,
                }}
              >
                ⇧T
              </UIText>
            </HStack>
            <Toggle
              checked={preferences?.showTransactionsOnAssetChart}
              onChange={(event) => {
                setPreferences({
                  showTransactionsOnAssetChart: event.target.checked,
                });
                if (dialogRef.current) {
                  dialogRef.current.close();
                }
              }}
            />
          </HStack>
        </VStack>
      </BottomSheetDialog>
    </>
  );
}
