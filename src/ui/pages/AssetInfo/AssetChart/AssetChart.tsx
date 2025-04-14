import React, { useEffect, useMemo, useRef } from 'react';
import { useStore } from '@store-unit/react';
import Chart, { type ScriptableLineSegmentContext } from 'chart.js/auto';
import { UIText } from 'src/ui/ui-kit/UIText';
import { useEvent } from 'src/ui/shared/useEvent';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { equal } from 'src/modules/fast-deep-equal';
import type { Theme } from 'src/ui/features/appearance';
import { themeStore } from 'src/ui/features/appearance';
import { formatPriceValue } from 'src/shared/units/formatPriceValue';
import {
  getSortedRangeIndexes,
  toScatterData,
  getChartColor,
  getYLimits,
} from './helpers';
import { CHART_HEIGHT, DEFAULT_CONFIG } from './config';
import { drawDotPlugin, drawRangePlugin } from './plugins';

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
  chart: Chart;
  prevPoints: [number, number][];
  nextPoints: [number, number][];
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
  chartPoints: [number, number][];
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

export function AssetChart({
  chartPoints,
  onRangeSelect,
  style,
}: {
  chartPoints: [number, number][];
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

  const chartPointsRef = useRef<[number, number][]>([]);
  const endRangeIndexRef = useRef<number | null>(null);
  const startRangeIndexRef = useRef<number | null>(null);
  const startRangeXRef = useRef<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
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

    chartRef.current = new Chart(ctx, {
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
          },
        ],
      },
      options: {
        ...DEFAULT_CONFIG.options,
        onHover: (_, __, chart) => {
          chart.update();
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
          getStartRangeIndex: () => startRangeIndexRef.current,
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
  }, [onRangeSelectEvent]);

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
