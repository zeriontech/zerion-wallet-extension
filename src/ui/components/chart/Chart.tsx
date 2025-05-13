import React, { useEffect, useMemo, useRef } from 'react';
import { useStore } from '@store-unit/react';
import type { InteractionItem, InteractionModeFunction } from 'chart.js/auto';
import ChartJS, {
  Interaction,
  type ScriptableLineSegmentContext,
} from 'chart.js/auto';
import { getRelativePosition } from 'chart.js/helpers';
import { UIText } from 'src/ui/ui-kit/UIText';
import { useEvent } from 'src/ui/shared/useEvent';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { equal } from 'src/modules/fast-deep-equal';
import { Theme } from 'src/ui/features/appearance';
import { themeStore } from 'src/ui/features/appearance';
import { formatPriceValue } from 'src/shared/units/formatPriceValue';
import type { Asset } from 'src/modules/zerion-api/requests/asset-get-fungible-full-info';
import {
  getSortedRangeIndexes,
  toScatterData,
  getChartColor,
  getYLimits,
  serializeAssetChartActions,
} from './helpers';
import { CHART_HEIGHT, DEFAULT_CONFIG } from './config';
import { drawDotPlugin, drawRangePlugin } from './plugins';
import type { ChartPoint, ParsedChartPoint } from './types';
import { externalTooltip } from './tooltip';

declare module 'chart.js' {
  interface InteractionModeMap {
    magneticActions: InteractionModeFunction;
  }
}

function getDistance(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
) {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
  );
}

Interaction.modes.magneticActions = function (chart, e) {
  const indexPoints = Interaction.modes.index(chart, e, {
    axis: 'x',
    intersect: false,
  });
  const activePoint = indexPoints[0];

  if (!activePoint) {
    return [];
  }

  const marneticRadius = 4;
  let closestPointWithExtra: InteractionItem | null = null;
  const position = getRelativePosition(e, chart);

  Interaction.evaluateInteractionItems(
    chart,
    'xy',
    position,
    (element, datasetIndex, index) => {
      if (Math.abs(element.x - position.x) > marneticRadius) {
        return;
      }
      if (
        'raw' in element &&
        Boolean((element.raw as ParsedChartPoint)?.actions)
      ) {
        if (!closestPointWithExtra) {
          closestPointWithExtra = {
            element,
            datasetIndex,
            index,
          };
        } else if (
          Math.abs(element.x - position.x) <
          Math.abs(closestPointWithExtra.element.x - position.x)
        ) {
          closestPointWithExtra = {
            element,
            datasetIndex,
            index,
          };
        }
      }
    }
  );

  const activePointMagneticRadius = 8;
  if (
    !closestPointWithExtra ||
    getDistance(position, activePoint.element) < activePointMagneticRadius
  ) {
    return [activePoint];
  }

  return [closestPointWithExtra];
};

/**
 * Chart update animation algorithm:
 *
 * In case there are previous points:
 * 1. Update the dataset with the new points
 * 2. Add the previous points as a new dataset
 * 3. Keep chart scales based on the previous points
 * 4. Update the chart without animation
 * 5. Update chart scales based on the new points and animate the update
 * 6. Remove the previous points during the animation
 *
 * In case ther is no previous points:
 * 1. Update the dataset with the new points
 * 2. Update the chart scales without animation
 * 3. Show the chart with animation
 */
function updateChartPoints({
  chart,
  prevPoints,
  nextPoints,
  theme,
}: {
  chart: ChartJS;
  prevPoints: ChartPoint[];
  nextPoints: ChartPoint[];
  theme: Theme;
}) {
  const { min: prevYMin, max: prevYMax } = getYLimits(prevPoints);
  const { min: nextYMin, max: nextYMax } = getYLimits(nextPoints);

  chart.data.datasets[0].data = toScatterData(nextPoints);

  if (prevPoints.length) {
    chart.data.datasets[1] = {
      data: toScatterData(prevPoints),
      borderColor: getChartColor({
        theme,
        isPositive: prevPoints[0]?.[1] <= (prevPoints.at(-1)?.[1] || 0),
        isHighlighted: false,
      }),
    };
    chart.options.scales = {
      x: {
        display: false,
        min: prevPoints[0]?.[0],
        max: prevPoints.at(-1)?.[0],
      },
      y: { display: false, min: prevYMin, max: prevYMax },
    };
    chart.update('none');
    chart.options.animation = {
      duration: 700,
      onComplete: () => {
        chart.data.datasets.pop();
        chart.options.animation = undefined;
        chart.update('none');
      },
    };
  }

  chart.options.scales = {
    x: {
      display: false,
      min: nextPoints[0]?.[0],
      max: nextPoints.at(-1)?.[0],
    },
    y: { display: false, min: nextYMin, max: nextYMax },
  };

  if (prevPoints.length) {
    chart.update();
    chart.hide(1);
  } else {
    chart.update('none');
    chart.show(0);
  }
}

/**
 * There are 3 cases:
 * 1. Chart is not hovered
 * - We shouldn't highlight any segment
 * 2. Active element is selected
 * - We need to highlight the segment after the active point
 * 3. The range is selected
 * - We need to highlight the segment inside the range
 */
function getSegmentColor({
  ctx,
  startRangeIndex: startRangeIndexRaw,
  endRangeIndex: endRangeIndexRaw,
  chartPoints,
  theme,
}: {
  ctx: ScriptableLineSegmentContext;
  startRangeIndex: number | null;
  endRangeIndex: number | null;
  chartPoints: ChartPoint[];
  theme: Theme;
}) {
  const { startRangeIndex, endRangeIndex } = getSortedRangeIndexes({
    startRangeIndex: startRangeIndexRaw,
    endRangeIndex: endRangeIndexRaw,
  });

  const endValue = chartPoints.at(endRangeIndex ?? -1)?.[1] || 0;
  const startValue = chartPoints[startRangeIndex ?? 0]?.[1] || 0;

  const afterActivePoint =
    startRangeIndex === null &&
    endRangeIndex != null &&
    ctx.p1DataIndex > endRangeIndex;

  const insideTheRange =
    startRangeIndex !== null &&
    endRangeIndex != null &&
    (startRangeIndex - ctx.p0DataIndex) * (ctx.p1DataIndex - endRangeIndex) < 0;

  return getChartColor({
    theme,
    isPositive: endValue >= startValue,
    isHighlighted: afterActivePoint || insideTheRange,
  });
}

export function Chart({
  asset,
  chartPoints,
  onRangeSelect,
  style,
}: {
  asset: Asset;
  chartPoints: ChartPoint[];
  onRangeSelect: ({
    startRangeIndex,
    endRangeIndex,
  }: {
    startRangeIndex: number | null;
    endRangeIndex: number | null;
  }) => void;
  style?: React.CSSProperties;
}) {
  const { currency } = useCurrency();
  const { theme } = useStore(themeStore);
  const onRangeSelectEvent = useEvent(onRangeSelect);

  const chartPointsRef = useRef<ChartPoint[]>([]);
  const endRangeIndexRef = useRef<number | null>(null);
  const startRangeIndexRef = useRef<number | null>(null);
  const startRangeXRef = useRef<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);
  const themeRef = useRef<Theme>(theme);
  themeRef.current = theme;
  const assetRef = useRef<Asset>(asset);
  assetRef.current = asset;

  const maxChartPointValue = useMemo(() => {
    return chartPoints.length
      ? Math.max(...chartPoints.map(([, value]) => value))
      : null;
  }, [chartPoints]);

  const minChartPointValue = useMemo(() => {
    return chartPoints.length
      ? Math.min(...chartPoints.map(([, value]) => value))
      : null;
  }, [chartPoints]);

  const getPointColor = useEvent((isPositive: boolean) => {
    return getChartColor({
      theme,
      isPositive,
      isHighlighted: false,
    });
  });

  const getPointBorderColor = useEvent(() => {
    return theme === Theme.light ? '#ffffff' : '#16161a';
  });

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) {
      return;
    }

    chartRef.current = new ChartJS(ctx, {
      ...DEFAULT_CONFIG,
      data: {
        datasets: [
          {
            data: [],
            hidden: true,
            pointRadius: (ctx) => {
              const hasDataPoint = Boolean(
                (ctx.raw as ParsedChartPoint)?.actions
              );
              return hasDataPoint ? 4 : 0;
            },
            pointHoverRadius: (ctx) => {
              const hasDataPoint = Boolean(
                (ctx.raw as ParsedChartPoint)?.actions
              );
              return hasDataPoint ? 8 : 0;
            },
            pointBorderColor: getPointBorderColor,
            pointBackgroundColor: (ctx) => {
              const isPositive =
                (ctx.raw as ParsedChartPoint)?.actions?.total.direction ===
                'in';
              const isNegative =
                (ctx.raw as ParsedChartPoint)?.actions?.total.direction ===
                'out';
              return isPositive || isNegative
                ? getPointColor(isPositive)
                : 'grey';
            },
            pointBorderWidth: 1,
            pointHoverBorderWidth: 2,
            segment: {
              borderColor: (ctx) =>
                getSegmentColor({
                  ctx,
                  startRangeIndex: startRangeIndexRef.current,
                  endRangeIndex: endRangeIndexRef.current,
                  chartPoints: chartPointsRef.current,
                  theme: themeRef.current,
                }),
            },
          },
        ],
      },
      options: {
        ...DEFAULT_CONFIG.options,
        interaction: { mode: 'magneticActions' },
        onHover: (_, __, chart) => {
          chart.update();
        },
        plugins: {
          ...DEFAULT_CONFIG.options?.plugins,
          tooltip: {
            ...DEFAULT_CONFIG.options?.plugins?.tooltip,
            external: externalTooltip,
            callbacks: {
              label: (ctx) => {
                const actions = (ctx.raw as ParsedChartPoint)?.actions;
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
                const actions = (ctx[0].raw as ParsedChartPoint)?.actions;
                if (!actions) {
                  return '';
                }
                return `${actions.count}`;
              },
            },
          },
        },
      },
      plugins: [
        {
          id: 'mouseSelectPlugin',
          beforeEvent: (chart, args) => {
            if (args.event.type === 'mousedown') {
              startRangeIndexRef.current =
                chart.getActiveElements()[0]?.index ?? null;
              startRangeXRef.current = args.event.x;
            }
            if (args.event.type === 'mousemove') {
              endRangeIndexRef.current =
                chart.getActiveElements()[0]?.index ?? null;
            }
            if (
              args.event.type === 'mouseout' ||
              args.event.type === 'mouseup'
            ) {
              endRangeIndexRef.current = null;
              startRangeIndexRef.current = null;
              startRangeXRef.current = null;
            }
            onRangeSelectEvent(
              getSortedRangeIndexes({
                startRangeIndex: startRangeIndexRef.current,
                endRangeIndex: endRangeIndexRef.current,
              })
            );
          },
          afterEvent: (chart, args) => {
            if (args.event.type === 'mouseout') {
              chart.update();
            }
          },
        },
        drawDotPlugin({
          getTheme: () => themeRef.current,
        }),
        drawRangePlugin({
          getStartRangeX: () => startRangeXRef.current,
          getTheme: () => themeRef.current,
        }),
      ],
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [onRangeSelectEvent, currency, getPointColor, getPointBorderColor]);

  if (!equal(chartPointsRef.current, chartPoints) && chartRef.current) {
    updateChartPoints({
      chart: chartRef.current,
      prevPoints: chartPointsRef.current,
      nextPoints: chartPoints,
      theme,
    });
    chartPointsRef.current = chartPoints;
  }

  return (
    <div style={{ position: 'relative', height: CHART_HEIGHT, ...style }}>
      {maxChartPointValue != null ? (
        <UIText
          kind="caption/regular"
          color="var(--neutral-500)"
          style={{ position: 'absolute', top: -16, right: 8 }}
        >
          {formatPriceValue(maxChartPointValue, 'en', currency)}
        </UIText>
      ) : null}
      {minChartPointValue != null ? (
        <UIText
          kind="caption/regular"
          color="var(--neutral-500)"
          style={{ position: 'absolute', bottom: -16, right: 8 }}
        >
          {formatPriceValue(minChartPointValue, 'en', currency)}
        </UIText>
      ) : null}
      <canvas ref={canvasRef} />
    </div>
  );
}
