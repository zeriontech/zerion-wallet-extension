import React, { useEffect, useMemo, useRef } from 'react';
import Chart, { type Point, type ChartConfiguration } from 'chart.js/auto';
import { UIText } from 'src/ui/ui-kit/UIText';
import { useEvent } from 'src/ui/shared/useEvent';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { equal } from 'src/modules/fast-deep-equal';
import { Theme, themeStore } from 'src/ui/features/appearance';
import { useStore } from '@store-unit/react';

const CHART_HEIGHT = 170;
const CHART_ANIMATION_DURATION = 500;
const DEFAULT_CONFIG: ChartConfiguration<'scatter'> = {
  type: 'scatter',
  data: {
    datasets: [],
  },
  options: {
    events: ['mousemove', 'mouseout', 'mousedown', 'mouseup'],
    showLine: true,
    responsive: true,
    maintainAspectRatio: false,
    transitions: {
      show: {
        animations: {
          y: {
            from: CHART_HEIGHT,
          },
          colors: {
            type: 'color',
            from: 'transparent',
          },
        },
      },
      hide: {
        animations: {
          colors: {
            type: 'color',
            to: 'transparent',
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    animations: {
      updateAxis: {
        duration: CHART_ANIMATION_DURATION,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
        callbacks: {
          label: ({ parsed }) => {
            return `Value: ${parsed.y}`;
          },
        },
      },
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 0,
      },
      line: {
        borderWidth: 2,
        cubicInterpolationMode: 'monotone',
        spanGaps: true,
      },
    },
  },
};

function toScatterData(points: [number, number][]) {
  return points.map(([x, y]) => ({ x, y }));
}

function getChartColor({
  theme,
  isPositive,
  isHighlighted,
}: {
  theme: Theme;
  isPositive: boolean;
  isHighlighted: boolean;
}) {
  return isPositive
    ? theme === Theme.light
      ? isHighlighted
        ? '#99dbb4'
        : '#01a643'
      : isHighlighted
      ? '#2d4435'
      : '#4fbf67'
    : theme === Theme.light
    ? isHighlighted
      ? '#ffd0c9'
      : '#ff4a4a'
    : isHighlighted
    ? '#8a393b'
    : '#ff5c5c';
}

function getYLimits(points: [number, number][]) {
  const values = points.map(([, value]) => value);
  const minLimit = Math.min(...values);
  const maxLimit = Math.max(...values);
  const diff = maxLimit - minLimit;
  if (minLimit && maxLimit / minLimit < 1.02) {
    return { min: minLimit - diff * 5, max: maxLimit + diff * 5 };
  }
  return { min: minLimit - diff / 50, max: maxLimit + diff / 50 };
}

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

function getSortedRangeIndexes({
  startRangeIndex,
  endRangeIndex,
}: {
  startRangeIndex: number | null;
  endRangeIndex: number | null;
}) {
  if (startRangeIndex === null) {
    return { startRangeIndex, endRangeIndex };
  }
  if (endRangeIndex === null) {
    return { startRangeIndex: endRangeIndex, endRangeIndex: startRangeIndex };
  }
  if (startRangeIndex > endRangeIndex) {
    return { startRangeIndex: endRangeIndex, endRangeIndex: startRangeIndex };
  }
  return { startRangeIndex, endRangeIndex };
}

export function AssetChart({
  chartPoints,
  onRangeSelect,
}: {
  chartPoints: [number, number][];
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
  const chartPointsRef = useRef<[number, number][]>([]);
  const endRangeIndexRef = useRef<number | null>(null);
  const startRangeIndexRef = useRef<number | null>(null);
  const startRangeXRef = useRef<number | null>(null);
  const onRangeSelectEvent = useEvent(onRangeSelect);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

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
              borderColor: (ctx) => {
                const { startRangeIndex, endRangeIndex } =
                  getSortedRangeIndexes({
                    startRangeIndex: startRangeIndexRef.current,
                    endRangeIndex: endRangeIndexRef.current,
                  });

                const endValue =
                  chartPointsRef.current.at(endRangeIndex ?? -1)?.[1] || 0;
                const startValue =
                  chartPointsRef.current[startRangeIndex ?? 0]?.[1] || 0;

                const afterSinglePoint =
                  startRangeIndex === null &&
                  endRangeIndex != null &&
                  ctx.p1DataIndex > endRangeIndex;
                const insideTheRange =
                  startRangeIndex !== null &&
                  endRangeIndex != null &&
                  (startRangeIndex - ctx.p1DataIndex) *
                    (ctx.p1DataIndex - endRangeIndex) <
                    0;

                return getChartColor({
                  theme,
                  isPositive: endValue >= startValue,
                  isHighlighted: afterSinglePoint || insideTheRange,
                });
              },
            },
          },
        ],
      },
      options: {
        ...DEFAULT_CONFIG.options,
        onHover: (_, chartElement, chart) => {
          endRangeIndexRef.current = chartElement[0]?.index ?? null;
          onRangeSelectEvent(
            getSortedRangeIndexes({
              endRangeIndex: endRangeIndexRef.current,
              startRangeIndex: startRangeIndexRef.current,
            })
          );
          chart.update();
        },
      },
      plugins: [
        {
          id: 'mounseOutEvent',
          afterEvent(chart, args) {
            const event = args.event;
            if (event.type === 'mouseout') {
              endRangeIndexRef.current = null;
              startRangeIndexRef.current = null;
              startRangeXRef.current = null;
              onRangeSelectEvent(
                getSortedRangeIndexes({
                  endRangeIndex: endRangeIndexRef.current,
                  startRangeIndex: startRangeIndexRef.current,
                })
              );
              chart.update();
            }
          },
        },
        {
          id: 'activePointAndCrossMarker',
          afterDraw: (chart) => {
            const activeElement = chart.getActiveElements()?.[0];
            const { ctx } = chart;

            if (!activeElement || !ctx) {
              return;
            }

            const { x, y } = activeElement.element.tooltipPosition(false);
            const { data } = chart.data.datasets[0];
            const { startRangeIndex, endRangeIndex } = getSortedRangeIndexes({
              startRangeIndex: startRangeIndexRef.current,
              endRangeIndex: activeElement.index,
            });
            const endRangeValue =
              (data.at(endRangeIndex ?? -1) as Point)?.y || 0;
            const startRangeValue =
              (data[startRangeIndex ?? 0] as Point)?.y || 0;

            const color = getChartColor({
              theme,
              isPositive: endRangeValue >= startRangeValue,
              isHighlighted: false,
            });

            ctx.save();
            ctx.setLineDash([5, 5]);

            if (startRangeXRef.current == null) {
              // Draw vertical line
              ctx.beginPath();
              ctx.moveTo(x, 8);
              ctx.lineTo(x, chart.height - 2);
              ctx.strokeStyle = 'grey';
              ctx.lineWidth = 1;
              ctx.stroke();
              ctx.closePath();
            }

            // Draw horizontal line
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(chart.width, y);
            ctx.strokeStyle = 'grey';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.closePath();

            ctx.setLineDash([]);

            // Draw circle
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();
            ctx.closePath();

            ctx.restore();
          },
        },
        {
          id: 'rangeSelectPlugin',
          beforeEvent: (chart, args) => {
            if (args.event.type === 'mousedown') {
              startRangeIndexRef.current =
                chart.getActiveElements()[0]?.index ?? null;
              startRangeXRef.current = args.event.x;
            }
            if (args.event.type === 'mouseup') {
              startRangeIndexRef.current = null;
              startRangeXRef.current = null;
            }
          },
          afterDraw: (chart) => {
            const activeElement = chart.getActiveElements()?.[0];
            const { ctx } = chart;

            if (!activeElement || !ctx || !startRangeXRef.current) {
              return;
            }

            const clickedX = startRangeXRef.current;
            const { x } = activeElement.element.tooltipPosition(false);

            ctx.save();

            // Fill background between clickedX and x
            ctx.beginPath();
            ctx.moveTo(clickedX, 0);
            ctx.lineTo(clickedX, chart.height);
            ctx.lineTo(x, chart.height);
            ctx.lineTo(x, 0);
            ctx.closePath();
            ctx.fillStyle =
              theme === Theme.light
                ? 'rgba(0, 0, 0, 0.1)'
                : 'rgba(255, 255, 255, 0.1)';
            ctx.fill();

            ctx.restore();
          },
        },
      ],
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [onRangeSelectEvent, theme]);

  if (!equal(chartPointsRef.current, chartPoints) && chartRef.current) {
    updateChartPoints({
      chart: chartRef.current,
      prevPoints: chartPointsRef.current,
      nextPoints: chartPoints,
      theme,
    });
    chartPointsRef.current = [...chartPoints];
  }

  return (
    <div style={{ position: 'relative', height: CHART_HEIGHT }}>
      {maxChartPointValue != null ? (
        <UIText
          kind="caption/regular"
          color="var(--neutral-500)"
          style={{ position: 'absolute', top: -14, right: 0 }}
        >
          {formatCurrencyValue(maxChartPointValue, 'en', currency)}
        </UIText>
      ) : null}
      {minChartPointValue != null ? (
        <UIText
          kind="caption/regular"
          color="var(--neutral-500)"
          style={{ position: 'absolute', bottom: -14, right: 0 }}
        >
          {formatCurrencyValue(minChartPointValue, 'en', currency)}
        </UIText>
      ) : null}
      <canvas ref={canvasRef} />
    </div>
  );
}
