import { useStore } from '@store-unit/react';
import React, { useMemo, useRef } from 'react';
import type { Asset } from 'src/modules/zerion-api/requests/asset-get-fungible-full-info';
import { Chart } from 'src/ui/components/chart/Chart';
import { getChartColor } from 'src/ui/components/chart/helpers';
import {
  type ChartDatasetConfig,
  type ChartTooltipOptions,
  type ChartPlugins,
  type ChartInteraction,
} from 'src/ui/components/chart/types';
import { Theme, themeStore } from 'src/ui/features/appearance';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { serializeAssetChartActions } from './helpers';
import { externalTooltip } from './tooltip';
import {
  drawCapPointPlugin,
  drawDotPlugin,
  drawVerticalLinePlugin,
} from './plugins';
import type { AssetChartPoint, ParsedAssetChartPoint } from './types';
import './interaction';

export function AssetChart({
  asset,
  chartPoints,
  onRangeSelect,
}: {
  asset: Asset;
  chartPoints: AssetChartPoint[];
  onRangeSelect: ({
    startRangeIndex,
    endRangeIndex,
  }: {
    startRangeIndex: number | null;
    endRangeIndex: number | null;
  }) => void;
}) {
  const { currency } = useCurrency();
  const { theme } = useStore(themeStore);
  const themeRef = useRef<Theme>(theme);
  themeRef.current = theme;

  const assetRef = useRef<Asset>(asset);
  assetRef.current = asset;

  const datasetConfig = useMemo<ChartDatasetConfig>(
    () => ({
      pointRadius: (ctx) => {
        const hasDataPoint = Boolean((ctx.raw as ParsedAssetChartPoint)?.extra);
        return hasDataPoint ? 4 : 0;
      },
      pointHoverRadius: (ctx) => {
        const hasDataPoint = Boolean((ctx.raw as ParsedAssetChartPoint)?.extra);
        return hasDataPoint ? 8 : 0;
      },
      animations: {
        radius: {
          duration: 200,
        },
      },
      pointBorderColor: () => {
        return themeRef.current === Theme.light ? '#ffffff' : '#16161a';
      },
      pointBackgroundColor: (ctx) => {
        const pointData = ctx.raw as ParsedAssetChartPoint;
        const isPositive = pointData?.extra?.total.direction === 'in';
        const isNegative = pointData?.extra?.total.direction === 'out';

        return isPositive || isNegative
          ? getChartColor({
              theme: themeRef.current,
              isPositive,
              isHighlighted: false,
            })
          : themeRef.current === Theme.light
          ? '#9c9fa8'
          : '#70737b';
      },
      pointBorderWidth: 1,
      pointHoverBorderWidth: 2,
    }),
    []
  );

  const tooltip = useMemo<ChartTooltipOptions>(
    () => ({
      external: externalTooltip,
      callbacks: {
        title: (ctx) => {
          const actions = (ctx[0].raw as ParsedAssetChartPoint)?.extra;
          return actions
            ? serializeAssetChartActions({
                action: {
                  ...actions.total,
                  // we need to color the tooltip based on the action value sign, not direction field
                  direction:
                    actions.total.value > 0
                      ? 'in'
                      : actions.total.value < 0
                      ? 'out'
                      : null,
                },
                asset: assetRef.current,
                currency,
              })
            : '';
        },
        beforeBody: (ctx) => {
          const actions = (ctx[0].raw as ParsedAssetChartPoint)?.extra;
          return actions ? `${actions.count}` : '';
        },
        label: (ctx) => {
          const actions = (ctx.raw as ParsedAssetChartPoint)?.extra;
          return actions
            ? actions.preview.map((action) =>
                serializeAssetChartActions({
                  action,
                  asset: assetRef.current,
                  currency,
                })
              )
            : '';
        },
      },
    }),
    [currency]
  );

  const plugins = useMemo<ChartPlugins>(
    () => [
      drawDotPlugin({ getTheme: () => themeRef.current }),
      drawVerticalLinePlugin({ getTheme: () => themeRef.current }),
      drawCapPointPlugin({ getTheme: () => themeRef.current }),
    ],
    []
  );

  const interaction = useMemo<ChartInteraction>(
    () => ({ mode: 'magneticActions' }),
    []
  );

  return (
    <Chart
      chartPoints={chartPoints}
      onRangeSelect={onRangeSelect}
      datasetConfig={datasetConfig}
      tooltip={tooltip}
      plugins={plugins}
      interaction={interaction}
      style={{ position: 'relative', left: -16, width: 'calc(100% + 32px)' }}
      theme={theme}
      currency={currency}
    />
  );
}
