import { useStore } from '@store-unit/react';
import React, { useMemo, useRef } from 'react';
import type { PointStyle } from 'chart.js';
import type { Asset } from 'src/modules/zerion-api/requests/asset-get-fungible-full-info';
import { Chart } from 'src/ui/components/chart/Chart';
import {
  type ChartDatasetConfig,
  type ChartTooltipOptions,
  type ChartPlugins,
  type ChartInteraction,
} from 'src/ui/components/chart/types';
import { Theme, themeStore } from 'src/ui/features/appearance';
import { useCurrency } from 'src/modules/currency/useCurrency';
import type { AssetChartActionDirection } from 'src/modules/zerion-api/requests/asset-get-chart';
import { serializeAssetChartActions } from './helpers';
import { externalTooltip } from './tooltip';
import {
  drawCapPointPlugin,
  drawDotPlugin,
  drawVerticalLinePlugin,
  PULSE_CAP_CIRCLE_ID,
} from './plugins';
import type { AssetChartPoint, ParsedAssetChartPoint } from './types';
import * as styles from './styles.module.css';
import './interaction';

const MultiActionPointImages = {
  in: {
    light: new Image(),
    dark: new Image(),
  },
  out: {
    light: new Image(),
    dark: new Image(),
  },
};

MultiActionPointImages.in.light.src =
  'https://cdn.zerion.io/images/dna-assets/chart-dot-positive-light.svg';
MultiActionPointImages.in.dark.src =
  'https://cdn.zerion.io/images/dna-assets/chart-dot-positive-dark.svg';
MultiActionPointImages.out.light.src =
  'https://cdn.zerion.io/images/dna-assets/chart-dot-negative-light.svg';
MultiActionPointImages.out.dark.src =
  'https://cdn.zerion.io/images/dna-assets/chart-dot-negative-dark.svg';

function getChartPointColor({
  theme,
  direction,
}: {
  theme: Theme;
  direction: AssetChartActionDirection;
}): string {
  return direction === 'in'
    ? theme === Theme.light
      ? '#01a643'
      : '#4fbf67'
    : direction === 'out'
    ? theme === Theme.light
      ? '#ff4a4a'
      : '#ff5c5c'
    : theme === Theme.light
    ? '#9c9fa8'
    : '#70737b';
}

function getChartPointBorderColor({
  theme,
  direction,
}: {
  theme: Theme;
  direction: AssetChartActionDirection;
}): string {
  return direction === 'in'
    ? theme === Theme.light
      ? '#edfcf2'
      : '#29342f'
    : direction === 'out'
    ? theme === Theme.light
      ? '#fcf2ef'
      : '#382328'
    : theme === Theme.light
    ? '#f0f0f2'
    : '#29292c';
}

function getPointStyle({
  theme,
  count,
  direction,
}: {
  theme: Theme;
  count: number;
  direction: AssetChartActionDirection;
}): PointStyle {
  if (count > 1 && direction) {
    return MultiActionPointImages[direction][
      theme === Theme.light ? 'light' : 'dark'
    ];
  }
  return 'circle';
}

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
        return hasDataPoint ? 4 : 0;
      },
      animations: {
        radius: {
          duration: 200,
        },
      },
      pointBorderColor: (ctx) => {
        const pointData = ctx.raw as ParsedAssetChartPoint;
        return getChartPointBorderColor({
          theme: themeRef.current,
          direction: pointData?.extra?.total.direction || null,
        });
      },
      pointBackgroundColor: (ctx) => {
        const pointData = ctx.raw as ParsedAssetChartPoint;

        return getChartPointColor({
          theme: themeRef.current,
          direction: pointData?.extra?.total.direction || null,
        });
      },
      pointStyle: (ctx) => {
        const pointData = ctx.raw as ParsedAssetChartPoint;
        return getPointStyle({
          count: pointData?.extra?.count || 0,
          theme: themeRef.current,
          direction: pointData?.extra?.total.direction || null,
        });
      },
      pointBorderWidth: 1,
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
                  // we need to color total string based on the value sign, not direction field
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
    <div style={{ position: 'relative' }}>
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
      <div id={PULSE_CAP_CIRCLE_ID} className={styles.pulseCircle} />
    </div>
  );
}
