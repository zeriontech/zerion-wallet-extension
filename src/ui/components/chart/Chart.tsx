import React, { useEffect, useMemo, useRef } from 'react';
import ChartJS, { type ScriptableLineSegmentContext } from 'chart.js/auto';
import { UIText } from 'src/ui/ui-kit/UIText';
import { useEvent } from 'src/ui/shared/useEvent';
import { equal } from 'src/modules/fast-deep-equal';
import { formatPriceValue } from 'src/shared/units/formatPriceValue';
import type { Theme } from 'src/ui/features/appearance';
import {
  getSortedRangeIndexes,
  toScatterData,
  getChartColor,
  getYLimits,
  getXLimits,
} from './helpers';
import { CHART_HEIGHT, DEFAULT_CONFIG } from './config';
import { drawRangePlugin } from './plugins';
import type {
  ChartPoint,
  ChartDatasetConfig,
  ChartTooltipOptions,
  ChartPlugins,
  ChartInteraction,
} from './types';

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
function updateChartPoints<T>({
  chart,
  prevPoints,
  nextPoints,
  theme,
}: {
  chart: ChartJS;
  prevPoints: ChartPoint<T>[];
  nextPoints: ChartPoint<T>[];
  theme: Theme;
}) {
  const { min: prevYMin, max: prevYMax } = getYLimits(prevPoints);
  const { min: nextYMin, max: nextYMax } = getYLimits(nextPoints);

  const { min: prevXMin, max: prevXMax } = getXLimits(prevPoints);
  const { min: nextXMin, max: nextXMax } = getXLimits(nextPoints);

  chart.data.datasets[0].data = toScatterData(nextPoints);

  if (prevPoints.length) {
    chart.data.datasets[1] = {
      data: toScatterData(prevPoints),
      borderColor: getChartColor({
        theme,
        isPositive:
          (prevPoints.at(0)?.[1] || 0) <= (prevPoints.at(-1)?.[1] || 0),
        isHighlighted: false,
      }),
    };
    chart.options.scales = {
      x: { display: false, min: prevXMin, max: prevXMax },
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
    x: { display: false, min: nextXMin, max: nextXMax },
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
function getSegmentColor<T>({
  ctx,
  startRangeIndex: startRangeIndexRaw,
  endRangeIndex: endRangeIndexRaw,
  chartPoints,
  theme,
}: {
  ctx: ScriptableLineSegmentContext;
  startRangeIndex: number | null;
  endRangeIndex: number | null;
  chartPoints: ChartPoint<T>[];
  theme: Theme;
}) {
  const { startRangeIndex, endRangeIndex } = getSortedRangeIndexes({
    startRangeIndex: startRangeIndexRaw,
    endRangeIndex: endRangeIndexRaw,
  });

  const endValue = chartPoints.at(endRangeIndex ?? -1)?.[1] || 0;
  const startValue = chartPoints.at(startRangeIndex ?? 0)?.[1] || 0;

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

export function Chart<T>({
  chartPoints,
  onRangeSelect,
  style,
  datasetConfig,
  tooltip,
  plugins,
  interaction,
  theme,
  currency,
}: {
  chartPoints: ChartPoint<T>[];
  onRangeSelect: ({
    startRangeIndex,
    endRangeIndex,
  }: {
    startRangeIndex: number | null;
    endRangeIndex: number | null;
  }) => void;
  style?: React.CSSProperties;
  datasetConfig?: ChartDatasetConfig;
  tooltip?: ChartTooltipOptions;
  plugins?: ChartPlugins;
  interaction?: ChartInteraction;
  theme: Theme;
  currency: string;
}) {
  const onRangeSelectEvent = useEvent(onRangeSelect);

  const chartPointsRef = useRef<ChartPoint<T>[]>([]);
  const endRangeIndexRef = useRef<number | null>(null);
  const startRangeIndexRef = useRef<number | null>(null);
  const startRangeXRef = useRef<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);
  const themeRef = useRef<Theme>(theme);
  themeRef.current = theme;

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
            ...datasetConfig,
          },
        ],
      },
      options: {
        ...DEFAULT_CONFIG.options,
        interaction,
        onHover: (_, __, chart) => {
          chart.update();
        },
        plugins: {
          ...DEFAULT_CONFIG.options?.plugins,
          tooltip: {
            ...DEFAULT_CONFIG.options?.plugins?.tooltip,
            ...tooltip,
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
            if (args.event.type === 'mouseout') {
              endRangeIndexRef.current = null;
              startRangeIndexRef.current = null;
              startRangeXRef.current = null;
            }
            // chart is still hovered so we shouldn't reset the end of the range
            if (args.event.type === 'mouseup') {
              endRangeIndexRef.current =
                chart.getActiveElements()[0]?.index ?? null;
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
        drawRangePlugin({
          getStartRangeX: () => startRangeXRef.current,
          getTheme: () => themeRef.current,
        }),
        ...(plugins || []),
      ],
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [onRangeSelectEvent, datasetConfig, plugins, tooltip, interaction]);

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
