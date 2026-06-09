import type { Chart, Plugin, TooltipOptions } from 'chart.js';
import { createNode as r } from 'src/content-script/in-dapp-notifications/createNode';
import { formatPriceValue } from 'src/shared/units/formatPriceValue';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { Theme } from 'src/ui/features/appearance';
import type { PerpCandleInterval } from 'src/modules/hyperliquid/api/requests/perp-candle-snapshot.types';

const PILL_PADDING_X = 6;
const PILL_PADDING_Y = 2;
const PILL_FONT = '12px SF Pro Display, system-ui, sans-serif';
const TOOLTIP_OFFSET = 8;

export interface CursorState {
  x: number;
  y: number;
  t: number;
}

const intradayFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const dayFormatter = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

function drawPill(
  ctx: CanvasRenderingContext2D,
  pillX: number,
  pillY: number,
  pillWidth: number,
  pillHeight: number,
  bg: string
) {
  const radius = 4;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillWidth, pillHeight, radius);
  ctx.fill();
}

export function drawHorizontalLinePlugin({
  getCursor,
  getTheme,
  getCurrency,
}: {
  getCursor: () => CursorState | null;
  getTheme: () => Theme;
  getCurrency: () => string;
}): Plugin {
  return {
    id: 'perpHorizontalLine',
    afterDraw: (chart) => {
      const cursor = getCursor();
      const { ctx, chartArea } = chart;
      if (!ctx || cursor == null) return;
      const cursorY = cursor.y;
      if (cursorY < chartArea.top || cursorY > chartArea.bottom) return;

      const yScale = chart.scales.y;
      if (!yScale) return;
      const price = yScale.getValueForPixel(cursorY);
      if (price == null) return;

      const theme = getTheme();
      const lineColor = theme === Theme.dark ? '#4b4b4d' : '#e1e1e1';
      const pillBg = '#16161a';
      const pillText = '#ffffff';

      ctx.save();

      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1;
      ctx.moveTo(chartArea.left, cursorY);
      ctx.lineTo(chartArea.right, cursorY);
      ctx.stroke();
      ctx.setLineDash([]);

      const label = formatPriceValue(price, 'en', getCurrency());
      ctx.font = PILL_FONT;
      const textWidth = ctx.measureText(label).width;
      const pillWidth = textWidth + PILL_PADDING_X * 2;
      const pillHeight = 16 + PILL_PADDING_Y * 2;
      const pillX = chartArea.right - pillWidth;
      const pillY = cursorY - pillHeight / 2;

      drawPill(ctx, pillX, pillY, pillWidth, pillHeight, pillBg);

      ctx.fillStyle = pillText;
      ctx.textBaseline = 'middle';
      ctx.fillText(label, pillX + PILL_PADDING_X, cursorY);

      ctx.restore();
    },
  };
}

function formatCursorTime(
  t: number,
  interval: PerpCandleInterval | undefined
): string {
  const date = new Date(t);
  const isIntraday =
    interval == null ||
    interval === '1m' ||
    interval === '5m' ||
    interval === '15m' ||
    interval === '1h' ||
    interval === '12h';
  const formatter = isIntraday ? intradayFormatter : dayFormatter;
  return formatter.format(date);
}

export function drawVerticalLinePlugin({
  getCursor,
  getTheme,
  getInterval,
}: {
  getCursor: () => CursorState | null;
  getTheme: () => Theme;
  getInterval: () => PerpCandleInterval | undefined;
}): Plugin {
  return {
    id: 'perpVerticalLine',
    afterDraw: (chart) => {
      const cursor = getCursor();
      const { ctx, chartArea } = chart;
      if (!ctx || cursor == null) return;
      const cursorX = cursor.x;
      if (cursorX < chartArea.left || cursorX > chartArea.right) return;

      const theme = getTheme();
      const lineColor = theme === Theme.dark ? '#4b4b4d' : '#e1e1e1';
      const pillBg = '#16161a';
      const pillText = '#ffffff';

      ctx.save();

      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1;
      ctx.moveTo(cursorX, chartArea.top);
      ctx.lineTo(cursorX, chartArea.bottom);
      ctx.stroke();
      ctx.setLineDash([]);

      const label = formatCursorTime(cursor.t, getInterval());
      ctx.font = PILL_FONT;
      const textWidth = ctx.measureText(label).width;
      const pillWidth = textWidth + PILL_PADDING_X * 2;
      const pillHeight = 16 + PILL_PADDING_Y * 2;
      const idealLeft = cursorX - pillWidth / 2;
      const pillX = Math.max(
        chartArea.left,
        Math.min(idealLeft, chartArea.right - pillWidth)
      );
      const pillY = chartArea.bottom + 1;

      drawPill(ctx, pillX, pillY, pillWidth, pillHeight, pillBg);

      ctx.fillStyle = pillText;
      ctx.textBaseline = 'middle';
      ctx.fillText(label, pillX + PILL_PADDING_X, pillY + pillHeight / 2);

      ctx.restore();
    },
  };
}

const TOOLTIP_CLASS = 'perp-candle-tooltip';

function getOrCreateTooltip(chart: Chart): HTMLDivElement {
  const parent = chart.canvas.parentNode as HTMLElement | null;
  let tooltipEl = parent?.querySelector<HTMLDivElement>(`.${TOOLTIP_CLASS}`);
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.classList.add(TOOLTIP_CLASS);
    tooltipEl.style.opacity = '0';
    tooltipEl.style.pointerEvents = 'none';
    tooltipEl.style.position = 'absolute';
    tooltipEl.style.transition = 'opacity 0.15s ease-in-out';
    tooltipEl.style.zIndex = '1';
    parent?.appendChild(tooltipEl);
  }
  return tooltipEl;
}

interface OhlcvData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const ROW_STYLE =
  'display: flex; align-items: center; justify-content: space-between; gap: 12px; min-width: 88px;';
const LABEL_STYLE =
  'font-size: 12px; line-height: 16px; letter-spacing: 0.2px; color: rgba(255,255,255,0.6);';
const VALUE_STYLE =
  'font-size: 12px; line-height: 16px; font-weight: 600; letter-spacing: 0.4px; color: #ffffff;';

function buildTooltipContent(data: OhlcvData, currency: string) {
  const row = (label: string, value: string) =>
    r(
      'div',
      { style: ROW_STYLE },
      r('span', { style: LABEL_STYLE }, label),
      r('span', { style: VALUE_STYLE }, value)
    );

  return r(
    'div',
    {
      style:
        'padding: 8px 12px; background-color: #2d2d31; border-radius: 8px; box-shadow: 0 4px 4px rgba(22,22,26,0.12); display: flex; flex-direction: column; gap: 2px;',
    },
    row('Open', formatPriceValue(data.open, 'en', currency)),
    row('High', formatPriceValue(data.high, 'en', currency)),
    row('Low', formatPriceValue(data.low, 'en', currency)),
    row('Close', formatPriceValue(data.close, 'en', currency)),
    row('Volume', formatTokenValue(data.volume))
  );
}

export function createExternalTooltip({
  getCurrency,
  getOhlcv,
  getCursor,
  getTradesSection,
}: {
  getCurrency: () => string;
  getOhlcv: (index: number) => OhlcvData | null;
  getCursor: () => CursorState | null;
  getTradesSection?: (candleTime: number) => HTMLElement | null;
}): TooltipOptions['external'] {
  return ({ chart, tooltip }) => {
    const tooltipEl = getOrCreateTooltip(chart);

    if (tooltip.opacity === 0) {
      tooltipEl.style.opacity = '0';
      return;
    }

    const candlestickPoint = tooltip.dataPoints?.find((p) => {
      const dataset = chart.data.datasets[p.datasetIndex];
      return dataset?.type === 'candlestick';
    });
    const index = candlestickPoint?.dataIndex;
    if (index == null) {
      tooltipEl.style.opacity = '0';
      return;
    }

    const ohlcv = getOhlcv(index);
    if (!ohlcv) {
      tooltipEl.style.opacity = '0';
      return;
    }

    const cursor = getCursor();
    const tradesSection =
      cursor && getTradesSection ? getTradesSection(cursor.t) : null;

    const content = buildTooltipContent(ohlcv, getCurrency());
    if (tradesSection) {
      content.appendChild(tradesSection);
    }
    tooltipEl.replaceChildren(content);

    const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;
    const cursorY = cursor?.y ?? tooltip.caretY;
    const inRightHalf = chart.width / 2 < tooltip.caretX;

    const tooltipHeight = tooltipEl.offsetHeight;
    const flipAbove =
      cursorY + TOOLTIP_OFFSET + tooltipHeight > chart.chartArea.bottom;
    const verticalTransform = flipAbove
      ? `translateY(calc(-100% - ${TOOLTIP_OFFSET}px))`
      : `translateY(${TOOLTIP_OFFSET}px)`;
    const horizontalTransform = inRightHalf
      ? `translateX(calc(-100% - ${TOOLTIP_OFFSET}px))`
      : `translateX(${TOOLTIP_OFFSET}px)`;

    tooltipEl.style.opacity = '1';
    tooltipEl.style.left = `${positionX + tooltip.caretX}px`;
    tooltipEl.style.top = `${positionY + cursorY}px`;
    tooltipEl.style.transform = `${horizontalTransform} ${verticalTransform}`;
  };
}
