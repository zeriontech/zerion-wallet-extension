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
import { useEvent } from 'src/ui/shared/useEvent';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { serializeAssetChartActions } from './helpers';
import { externalTooltip } from './tooltip';
import { drawDotPlugin } from './plugins';
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

  const getPointBorderColor = useEvent(() => {
    return theme === Theme.light ? '#ffffff' : '#16161a';
  });

  const getPointColor = useEvent((isPositive: boolean) => {
    return getChartColor({
      theme,
      isPositive,
      isHighlighted: false,
    });
  });

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
      pointBorderColor: getPointBorderColor,
      pointBackgroundColor: (ctx) => {
        const isPositive =
          (ctx.raw as ParsedAssetChartPoint)?.extra?.total.direction === 'in';
        const isNegative =
          (ctx.raw as ParsedAssetChartPoint)?.extra?.total.direction === 'out';
        return isPositive || isNegative ? getPointColor(isPositive) : 'grey';
      },
      pointBorderWidth: 1,
      pointHoverBorderWidth: 2,
    }),
    [getPointBorderColor, getPointColor]
  );

  const tooltip = useMemo<ChartTooltipOptions>(
    () => ({
      external: externalTooltip,
      callbacks: {
        label: (ctx) => {
          const actions = (ctx.raw as ParsedAssetChartPoint)?.extra;
          return actions
            ? [
                serializeAssetChartActions({
                  action: actions.total,
                  asset: assetRef.current,
                  currency,
                }),
                ...actions.preview.map((action) =>
                  serializeAssetChartActions({
                    action,
                    asset: assetRef.current,
                    currency,
                  })
                ),
              ]
            : '';
        },
        footer: (ctx) => {
          const actions = (ctx[0].raw as ParsedAssetChartPoint)?.extra;
          if (!actions) {
            return '';
          }
          return `${actions.count}`;
        },
      },
    }),
    [currency]
  );

  const plugins = useMemo<ChartPlugins>(
    () => [
      drawDotPlugin({
        getTheme: () => themeRef.current,
      }),
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
