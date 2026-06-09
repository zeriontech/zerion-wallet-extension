import React, { useEffect, useMemo, useRef } from 'react';
import {
  Chart,
  BarController,
  BarElement,
  LinearScale,
  TimeScale,
  Tooltip,
  type ChartEvent,
  type ActiveElement,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { useStore } from '@store-unit/react';
import type {
  PerpCandle,
  PerpCandleInterval,
} from 'src/modules/hyperliquid/api/requests/perp-candle-snapshot.types';
import type { PerpFill } from 'src/modules/hyperliquid/api/requests/perp-user-fills.types';
import { Theme, themeStore } from 'src/ui/features/appearance';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { formatPriceValue } from 'src/shared/units/formatPriceValue';
import './adapter';
import {
  CandlestickController,
  CandlestickElement,
  type CandlestickPoint,
} from './candlestickPlugin';
import {
  createExternalTooltip,
  drawHorizontalLinePlugin,
  drawVerticalLinePlugin,
  type CursorState,
} from './chartPlugins';
import {
  bucketFills,
  buildTradesTooltipSection,
  getCandleBucketStart,
  type TradeBuckets,
} from './tradeMarkers';

Chart.register(
  BarController,
  BarElement,
  LinearScale,
  TimeScale,
  Tooltip,
  CandlestickController,
  CandlestickElement,
  zoomPlugin
);

const DEFAULT_ZOOM_RATIO = 5;
const RIGHT_PADDING_CANDLES = 6;
const MIN_VISIBLE_CANDLES = 10;
const MIN_Y_TICK_LABEL_GAP = 16;

function computeRangeBounds(candles: PerpCandle[]) {
  if (candles.length === 0) {
    return null;
  }
  const firstT = candles[0].t;
  const lastT = candles[candles.length - 1].t;
  const totalSpan = Math.max(lastT - firstT, 1);
  const candleInterval =
    candles.length > 1 ? (lastT - firstT) / (candles.length - 1) : totalSpan;
  const minVisibleSpan = Math.max(
    candleInterval * MIN_VISIBLE_CANDLES,
    totalSpan / DEFAULT_ZOOM_RATIO
  );
  return {
    firstT,
    lastT,
    totalSpan,
    candleInterval,
    defaultMin: lastT - totalSpan / DEFAULT_ZOOM_RATIO,
    defaultMax: lastT,
    rightLimit: lastT + candleInterval * RIGHT_PADDING_CANDLES,
    minRange: minVisibleSpan,
  };
}

interface Props {
  candles: PerpCandle[];
  height: number;
  interval?: PerpCandleInterval;
  coin?: string;
  fills: PerpFill[];
  displayName: string;
}

export function CandleChart({
  candles,
  height,
  interval,
  coin,
  fills,
  displayName,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);
  const cursorRef = useRef<CursorState | null>(null);
  const isPanningRef = useRef(false);
  const prevLastTRef = useRef<number | null>(null);
  const prevCandlesRef = useRef<PerpCandle[] | null>(null);
  const pendingResetRef = useRef(false);

  const intervalRef = useRef(interval);
  intervalRef.current = interval;

  const { theme } = useStore(themeStore);
  const themeRef = useRef(theme);
  themeRef.current = theme;

  const { currency } = useCurrency();
  const currencyRef = useRef(currency);
  currencyRef.current = currency;

  const candlesRef = useRef(candles);
  candlesRef.current = candles;

  const displayNameRef = useRef(displayName);
  displayNameRef.current = displayName;

  const tradeBuckets = useMemo<TradeBuckets | null>(
    () => bucketFills(fills, candles),
    [fills, candles]
  );
  const tradeBucketsRef = useRef(tradeBuckets);
  tradeBucketsRef.current = tradeBuckets;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const candleData: CandlestickPoint[] = candlesRef.current.map((c) => ({
      x: c.t,
      o: Number(c.o),
      h: Number(c.h),
      l: Number(c.l),
      c: Number(c.c),
    }));
    const volumeData = candlesRef.current.map((c) => ({
      x: c.t,
      y: Number(c.v),
      _isUp: Number(c.c) >= Number(c.o),
    }));
    const maxVolume = volumeData.reduce((max, d) => (d.y > max ? d.y : max), 0);
    const initialBounds = computeRangeBounds(candlesRef.current);
    if (initialBounds) {
      prevLastTRef.current = initialBounds.lastT;
    }

    const chart = new Chart(canvas, {
      type: 'candlestick',
      data: {
        datasets: [
          {
            type: 'candlestick',
            label: 'OHLC',
            data: candleData,
            yAxisID: 'y',
            // @ts-expect-error custom element options
            upColor: '#01a345',
            downColor: '#e02f44',
            borderUpColor: '#01a345',
            borderDownColor: '#e02f44',
            wickUpColor: '#01a345',
            wickDownColor: '#e02f44',
          },
          {
            type: 'bar',
            label: 'Volume',
            data: volumeData as unknown as CandlestickPoint[],
            yAxisID: 'yVolume',
            backgroundColor: (ctx) => {
              const point = volumeData[ctx.dataIndex];
              return point?._isUp ? '#01a34533' : '#e02f4433';
            },
            borderWidth: 0,
            barPercentage: 0.9,
            categoryPercentage: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            type: 'time',
            min: initialBounds?.defaultMin,
            max: initialBounds?.defaultMax,
            time: {
              displayFormats: {
                minute: 'HH:mm',
                hour: 'HH:mm',
                day: 'MMM D',
                week: 'MMM D',
                month: 'MMM YYYY',
              },
            },
            grid: {
              color:
                themeRef.current === Theme.dark
                  ? 'rgba(255,255,255,0.04)'
                  : 'rgba(0,0,0,0.04)',
            },
            ticks: {
              color: themeRef.current === Theme.dark ? '#9c9fa8' : '#7B7E89',
              maxRotation: 0,
              autoSkipPadding: 16,
            },
            border: {
              color:
                themeRef.current === Theme.dark
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(0,0,0,0.06)',
            },
          },
          y: {
            type: 'linear',
            position: 'right',
            bounds: 'data',
            grid: {
              color:
                themeRef.current === Theme.dark
                  ? 'rgba(255,255,255,0.04)'
                  : 'rgba(0,0,0,0.04)',
            },
            ticks: {
              color: themeRef.current === Theme.dark ? '#9c9fa8' : '#7B7E89',
              callback: (value) =>
                formatPriceValue(Number(value), 'en', currencyRef.current),
            },
            afterTickToLabelConversion: (scale) => {
              const yTicks = scale.ticks;
              if (yTicks.length < 2) return;
              const topPixel = scale.getPixelForValue(
                Number(yTicks[yTicks.length - 1].value)
              );
              const secondPixel = scale.getPixelForValue(
                Number(yTicks[yTicks.length - 2].value)
              );
              if (Math.abs(secondPixel - topPixel) < MIN_Y_TICK_LABEL_GAP) {
                yTicks[yTicks.length - 2].label = '';
              }
            },
            border: {
              color:
                themeRef.current === Theme.dark
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(0,0,0,0.06)',
            },
          },
          yVolume: {
            type: 'linear',
            display: false,
            min: 0,
            max: Math.max(maxVolume * 5, 1),
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: false,
            external: createExternalTooltip({
              getCurrency: () => currencyRef.current,
              getCursor: () => cursorRef.current,
              getOhlcv: (index) => {
                const candle = candlesRef.current[index];
                if (!candle) return null;
                return {
                  open: Number(candle.o),
                  high: Number(candle.h),
                  low: Number(candle.l),
                  close: Number(candle.c),
                  volume: Number(candle.v),
                };
              },
              getTradesSection: (candleTime) => {
                const buckets = tradeBucketsRef.current;
                if (!buckets) return null;
                const bucketStart = getCandleBucketStart(
                  candleTime,
                  candlesRef.current
                );
                if (bucketStart == null) return null;
                const bucketFillsForTime =
                  buckets.fillsByBucket.get(bucketStart);
                if (!bucketFillsForTime || bucketFillsForTime.length === 0) {
                  return null;
                }
                return buildTradesTooltipSection(
                  bucketFillsForTime,
                  currencyRef.current,
                  displayNameRef.current
                );
              },
            }),
          },
          zoom: {
            pan: {
              enabled: true,
              mode: 'x',
              threshold: 4,
              onPanStart: () => {
                isPanningRef.current = true;
                cursorRef.current = null;
                canvas.style.cursor = 'grabbing';
                const tooltip = container.querySelector(
                  '.perp-candle-tooltip'
                ) as HTMLElement | null;
                if (tooltip) tooltip.style.opacity = '0';
                return undefined;
              },
              onPanComplete: () => {
                isPanningRef.current = false;
                canvas.style.cursor = 'grab';
              },
            },
            zoom: {
              wheel: { enabled: false },
              pinch: { enabled: false },
              drag: { enabled: false },
              mode: 'x',
            },
            limits: {
              x: {
                min: initialBounds?.firstT,
                max: initialBounds?.rightLimit,
                minRange: initialBounds?.minRange,
              },
            },
          },
        },
        onHover: (
          event: ChartEvent,
          activeElements: ActiveElement[],
          chartInstance
        ) => {
          if (isPanningRef.current) return;
          const native = event.native as MouseEvent | TouchEvent | null;
          if (!native) {
            cursorRef.current = null;
            chartInstance.draw();
            return;
          }
          if (native.type === 'mouseout' || native.type === 'pointerleave') {
            cursorRef.current = null;
            chartInstance.draw();
            return;
          }
          const y = (event as { y?: number }).y;
          const rawX = (event as { x?: number }).x;
          if (typeof y !== 'number' || typeof rawX !== 'number') {
            cursorRef.current = null;
            chartInstance.draw();
            return;
          }

          const xScale = chartInstance.scales.x;
          const activeIndex = activeElements[0]?.index;
          const candleList = candlesRef.current;

          let snappedIndex = typeof activeIndex === 'number' ? activeIndex : -1;
          if (snappedIndex < 0 && xScale && candleList.length > 0) {
            const xValue = xScale.getValueForPixel(rawX);
            if (xValue != null) {
              let bestIdx = 0;
              let bestDiff = Math.abs(candleList[0].t - xValue);
              for (let i = 1; i < candleList.length; i += 1) {
                const diff = Math.abs(candleList[i].t - xValue);
                if (diff < bestDiff) {
                  bestDiff = diff;
                  bestIdx = i;
                }
              }
              snappedIndex = bestIdx;
            }
          }

          const candle = candleList[snappedIndex];
          if (!candle || !xScale) {
            cursorRef.current = null;
            chartInstance.draw();
            return;
          }

          const snappedX = xScale.getPixelForValue(candle.t);
          cursorRef.current = { x: snappedX, y, t: candle.t };
          chartInstance.draw();
        },
      },
      plugins: [
        drawHorizontalLinePlugin({
          getCursor: () => cursorRef.current,
          getTheme: () => themeRef.current,
          getCurrency: () => currencyRef.current,
        }),
        drawVerticalLinePlugin({
          getCursor: () => cursorRef.current,
          getTheme: () => themeRef.current,
          getInterval: () => intervalRef.current,
        }),
      ],
    });

    chartRef.current = chart;
    canvas.style.cursor = 'grab';

    const handlePointerLeave = () => {
      cursorRef.current = null;
      chart.draw();
    };
    canvas.addEventListener('pointerleave', handlePointerLeave);

    const handleWheel = (e: WheelEvent) => {
      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);
      const isHorizontal = absX > absY;
      const isZoom = !isHorizontal && (e.metaKey || e.ctrlKey);

      if (!isHorizontal && !isZoom) return;

      e.preventDefault();

      const xScale = chart.scales.x;
      if (!xScale) return;
      const currentMin = xScale.min;
      const currentMax = xScale.max;
      const span = currentMax - currentMin;

      if (isHorizontal) {
        const pxPerMs = (xScale.right - xScale.left) / span;
        chart.pan({ x: -e.deltaX / pxPerMs }, undefined, 'none');
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const anchor = xScale.getValueForPixel(cursorX);
      if (anchor == null) return;

      const factor = e.deltaY < 0 ? 1 / 1.1 : 1.1;
      const newSpan = span * factor;

      const limits = chart.options.plugins?.zoom?.limits?.x;
      const limitMin = (limits?.min as number | undefined) ?? -Infinity;
      const limitMax = (limits?.max as number | undefined) ?? Infinity;
      const minRange = (limits?.minRange as number | undefined) ?? 0;
      const maxRange = limitMax - limitMin;
      const clampedSpan = Math.max(minRange, Math.min(newSpan, maxRange));

      const ratio = (anchor - currentMin) / span;
      let newMin = anchor - ratio * clampedSpan;
      let newMax = newMin + clampedSpan;
      if (newMin < limitMin) {
        newMin = limitMin;
        newMax = newMin + clampedSpan;
      }
      if (newMax > limitMax) {
        newMax = limitMax;
        newMin = newMax - clampedSpan;
      }

      const xOptions = chart.options.scales?.x;
      if (xOptions) {
        Object.assign(xOptions, { min: newMin, max: newMax });
        chart.update('none');
      }
    };
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    const handleDoubleClick = () => {
      const bounds = computeRangeBounds(candlesRef.current);
      if (!bounds) return;
      const xOptions = chart.options.scales?.x;
      if (xOptions) {
        Object.assign(xOptions, {
          min: bounds.defaultMin,
          max: bounds.defaultMax,
        });
        chart.update('none');
      }
    };
    canvas.addEventListener('dblclick', handleDoubleClick);

    return () => {
      canvas.removeEventListener('pointerleave', handlePointerLeave);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('dblclick', handleDoubleClick);
      const tooltip = container.querySelector('.perp-candle-tooltip');
      tooltip?.remove();
      chart.destroy();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    pendingResetRef.current = true;
  }, [interval, coin]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const candleData: CandlestickPoint[] = candles.map((c) => ({
      x: c.t,
      o: Number(c.o),
      h: Number(c.h),
      l: Number(c.l),
      c: Number(c.c),
    }));
    const volumeData = candles.map((c) => ({
      x: c.t,
      y: Number(c.v),
      _isUp: Number(c.c) >= Number(c.o),
    }));
    const maxVolume = volumeData.reduce((max, d) => (d.y > max ? d.y : max), 0);

    Object.assign(chart.data.datasets[0], { data: candleData });
    Object.assign(chart.data.datasets[1], { data: volumeData });
    const yVolume = chart.options.scales?.yVolume;
    if (yVolume) {
      Object.assign(yVolume, { max: Math.max(maxVolume * 5, 1) });
    }

    const bounds = computeRangeBounds(candles);
    const xOptions = chart.options.scales?.x;
    const zoomLimits = chart.options.plugins?.zoom?.limits?.x;
    if (bounds && xOptions) {
      if (zoomLimits) {
        Object.assign(zoomLimits, {
          min: bounds.firstT,
          max: bounds.rightLimit,
          minRange: bounds.minRange,
        });
      }

      const candlesChanged = prevCandlesRef.current !== candles;
      if (pendingResetRef.current && candlesChanged) {
        Object.assign(xOptions, {
          min: bounds.defaultMin,
          max: bounds.defaultMax,
        });
        pendingResetRef.current = false;
      } else if (!pendingResetRef.current) {
        const prevLastT = prevLastTRef.current;
        const prevMax = xOptions.max as number | undefined;
        const prevMin = xOptions.min as number | undefined;
        const wasPinnedRight =
          prevLastT != null &&
          prevMax != null &&
          prevMax >= prevLastT - bounds.candleInterval;

        if (wasPinnedRight && prevMin != null && prevMax != null) {
          const span = prevMax - prevMin;
          Object.assign(xOptions, {
            min: bounds.lastT - span,
            max: bounds.lastT,
          });
        }
      }
      prevLastTRef.current = bounds.lastT;
      prevCandlesRef.current = candles;
    }

    chart.update('none');
  }, [candles, interval, coin]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const isDark = theme === Theme.dark;
    const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
    const tickColor = isDark ? '#9c9fa8' : '#7B7E89';
    const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

    const xScale = chart.options.scales?.x;
    const yScale = chart.options.scales?.y;
    if (xScale) {
      Object.assign(xScale, {
        grid: { color: gridColor },
        ticks: { ...xScale.ticks, color: tickColor },
        border: { color: borderColor },
      });
    }
    if (yScale) {
      Object.assign(yScale, {
        grid: { color: gridColor },
        ticks: { ...yScale.ticks, color: tickColor },
        border: { color: borderColor },
      });
    }
    chart.update('none');
  }, [theme]);

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', height }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
