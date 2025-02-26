import React, { useEffect, useMemo, useRef } from 'react';
import Chart, { type Point, type ChartConfiguration } from 'chart.js/auto';
import { UIText } from 'src/ui/ui-kit/UIText';
import { useEvent } from 'src/ui/shared/useEvent';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { equal } from 'src/modules/fast-deep-equal';

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
        borderColor: 'green',
        spanGaps: true,
      },
    },
  },
};

function toScatterData(points: [number, number][]) {
  return points.map(([x, y]) => ({ x, y }));
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
}: {
  chart: Chart;
  prevPoints: [number, number][];
  nextPoints: [number, number][];
}) {
  const { min: prevYMin, max: prevYMax } = getYLimits(prevPoints);
  const { min: nextYMin, max: nextYMax } = getYLimits(nextPoints);

  chart.data.datasets[0].data = toScatterData(nextPoints);
  chart.data.datasets[1] = {
    data: toScatterData(prevPoints),
    borderColor:
      prevPoints[0]?.[1] <= (prevPoints.at(-1)?.[1] || 0) ? 'green' : 'red',
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

  chart.options.scales = {
    x: {
      display: false,
      min: nextPoints[0]?.[0],
      max: nextPoints.at(-1)?.[0],
    },
    y: { display: false, min: nextYMin, max: nextYMax },
  };
  chart.options.animation = {
    onComplete: () => {
      chart.data.datasets.pop();
      chart.options.animation = undefined;
      chart.update('none');
    },
  };
  chart.update();
  chart.hide(1);
}

export function AssetChart({
  chartPoints,
  onActiveElementChange,
}: {
  chartPoints: [number, number][];
  onActiveElementChange: (index: number) => void;
}) {
  const { currency } = useCurrency();
  const chartPointsRef = useRef<[number, number][]>([]);
  const activeElementIndexRef = useRef<number>(Infinity);
  const clickedElementIndexRef = useRef<number>(Infinity);
  const clickedElementXRef = useRef<number | null>(null);
  const onActiveElementChangeEvent = useEvent(onActiveElementChange);

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
            segment: {
              borderColor: (ctx) => {
                const isPositive =
                  (chartPointsRef.current[activeElementIndexRef.current]?.[1] ??
                    chartPointsRef.current.at(-1)?.[1]) >=
                  chartPointsRef.current[0]?.[1];
                const shouldHightlight =
                  (clickedElementIndexRef.current === Infinity &&
                    activeElementIndexRef.current !== Infinity &&
                    ctx.p1DataIndex > activeElementIndexRef.current) ||
                  (clickedElementIndexRef.current !== Infinity &&
                    activeElementIndexRef.current !== Infinity &&
                    (clickedElementIndexRef.current - ctx.p1DataIndex) *
                      (ctx.p1DataIndex - activeElementIndexRef.current) <
                      0);

                return shouldHightlight
                  ? isPositive
                    ? 'rgba(100, 255, 100, 0.5)'
                    : 'rgba(255, 0, 0, 0.5)'
                  : isPositive
                  ? 'green'
                  : 'red';
              },
            },
          },
        ],
      },
      options: {
        ...DEFAULT_CONFIG.options,
        onHover: (_, chartElement, chart) => {
          activeElementIndexRef.current = chartElement[0]?.index ?? Infinity;
          onActiveElementChangeEvent(activeElementIndexRef.current);
          chart.update();
        },
      },
      plugins: [
        {
          id: 'mounseOutEvent',
          afterEvent(chart, args) {
            const event = args.event;
            if (event.type === 'mouseout') {
              activeElementIndexRef.current = Infinity;
              clickedElementIndexRef.current = Infinity;
              clickedElementXRef.current = null;
              onActiveElementChangeEvent(activeElementIndexRef.current);
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
            const isPositive =
              (chart.data.datasets[0].data[activeElement.index] as Point).y >=
              chartPointsRef.current[0]?.[1];

            const color = isPositive ? 'green' : 'red';

            ctx.save();
            ctx.setLineDash([5, 5]);

            if (clickedElementXRef.current == null) {
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
              clickedElementIndexRef.current =
                chart.getActiveElements()[0]?.index ?? Infinity;
              clickedElementXRef.current = args.event.x;
            }
            if (args.event.type === 'mouseup') {
              clickedElementIndexRef.current = Infinity;
              clickedElementXRef.current = null;
            }
          },
          afterDraw: (chart) => {
            const activeElement = chart.getActiveElements()?.[0];
            const { ctx } = chart;

            if (!activeElement || !ctx || !clickedElementXRef.current) {
              return;
            }

            const clickedX = clickedElementXRef.current;
            const { x } = activeElement.element.tooltipPosition(false);

            ctx.save();

            // Fill background between clickedX and x
            ctx.beginPath();
            ctx.moveTo(clickedX, 0);
            ctx.lineTo(clickedX, chart.height);
            ctx.lineTo(x, chart.height);
            ctx.lineTo(x, 0);
            ctx.closePath();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fill();

            ctx.restore();
          },
        },
      ],
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [onActiveElementChangeEvent]);

  if (!equal(chartPointsRef.current, chartPoints) && chartRef.current) {
    updateChartPoints({
      chart: chartRef.current,
      prevPoints: chartPointsRef.current,
      nextPoints: chartPoints,
    });
    chartPointsRef.current = [...chartPoints];
  }

  return (
    <div style={{ position: 'relative', height: 200 }}>
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
