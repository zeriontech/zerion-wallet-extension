import { createNode as r } from 'src/content-script/in-dapp-notifications/createNode';
import { formatPriceValue } from 'src/shared/units/formatPriceValue';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import type { PerpFill } from 'src/modules/hyperliquid/api/requests/perp-user-fills.types';
import type { PerpCandle } from 'src/modules/hyperliquid/api/requests/perp-candle-snapshot.types';
import {
  classifyFill,
  type FillKind,
} from 'src/modules/hyperliquid/classifyFill';

export interface TradeBuckets {
  fillsByBucket: Map<number, PerpFill[]>;
}

function getCandleSpan(candles: PerpCandle[]): number {
  if (candles.length === 0) return 0;
  const sample = candles[0];
  if (sample.T > sample.t) return sample.T - sample.t;
  if (candles.length > 1) return candles[1].t - candles[0].t;
  return 0;
}

export function bucketFills(
  fills: PerpFill[],
  candles: PerpCandle[]
): TradeBuckets | null {
  if (candles.length === 0) return null;
  const span = getCandleSpan(candles);
  if (span <= 0) return null;
  const firstT = candles[0].t;
  const lastT = candles[candles.length - 1].t;
  const rangeMin = firstT;
  const rangeMax = lastT + span;

  const fillsByBucket = new Map<number, PerpFill[]>();
  for (const fill of fills) {
    if (fill.time < rangeMin || fill.time > rangeMax) continue;
    const offset = Math.floor((fill.time - firstT) / span);
    const bucketStart = firstT + offset * span;
    const existing = fillsByBucket.get(bucketStart);
    if (existing) {
      existing.push(fill);
    } else {
      fillsByBucket.set(bucketStart, [fill]);
    }
  }

  if (fillsByBucket.size === 0) return null;
  return { fillsByBucket };
}

export function getCandleBucketStart(
  candleTime: number,
  candles: PerpCandle[]
): number | null {
  if (candles.length === 0) return null;
  const span = getCandleSpan(candles);
  if (span <= 0) return null;
  const firstT = candles[0].t;
  const offset = Math.floor((candleTime - firstT) / span);
  return firstT + offset * span;
}

const TOOLTIP_TRADES_HEADER_STYLE =
  'font-size: 11px; line-height: 14px; letter-spacing: 0.4px; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-top: 4px;';
const TOOLTIP_TRADE_ROW_STYLE =
  'display: flex; align-items: center; gap: 8px; min-width: 180px;';
const TOOLTIP_BADGE_BASE_STYLE =
  'padding: 1px 6px; border-radius: 4px; font-size: 11px; line-height: 14px; font-weight: 600; letter-spacing: 0.2px; white-space: nowrap;';
const TOOLTIP_TRADE_TEXT_STYLE =
  'font-size: 12px; line-height: 16px; color: #ffffff; flex: 1; white-space: nowrap;';
const TOOLTIP_TRADE_PNL_STYLE =
  'font-size: 12px; line-height: 16px; font-weight: 600; letter-spacing: 0.2px; white-space: nowrap;';

function getBadgeStyle(kind: FillKind): string {
  if (kind.isLiquidation) {
    return `${TOOLTIP_BADGE_BASE_STYLE} background-color: rgba(224,47,68,0.18); color: #ff8a96;`;
  }
  if (kind.isOpen) {
    return `${TOOLTIP_BADGE_BASE_STYLE} background-color: rgba(1,163,69,0.18); color: #66e09f;`;
  }
  return `${TOOLTIP_BADGE_BASE_STYLE} background-color: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7);`;
}

export function buildTradesTooltipSection(
  fills: PerpFill[],
  currency: string,
  displayName: string
): HTMLElement {
  const sorted = [...fills].sort((a, b) => a.time - b.time);
  const rows = sorted.map((fill) => {
    const kind = classifyFill(fill);
    const px = Number(fill.px);
    const sz = Number(fill.sz);
    const closedPnl = Number(fill.closedPnl);
    const showPnl = closedPnl !== 0;
    const pnlColor = closedPnl >= 0 ? '#66e09f' : '#ff8a96';

    return r(
      'div',
      { style: TOOLTIP_TRADE_ROW_STYLE },
      r('span', { style: getBadgeStyle(kind) }, kind.label),
      r(
        'span',
        { style: TOOLTIP_TRADE_TEXT_STYLE },
        `${formatTokenValue(sz, displayName)} @ ${formatPriceValue(
          px,
          'en',
          currency
        )}`
      ),
      showPnl
        ? r(
            'span',
            { style: `${TOOLTIP_TRADE_PNL_STYLE} color: ${pnlColor};` },
            formatCurrencyValue(closedPnl, 'en', currency)
          )
        : null
    );
  });

  return r(
    'div',
    {
      style:
        'display: flex; flex-direction: column; gap: 4px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.08); margin-top: 4px;',
    },
    r('div', { style: TOOLTIP_TRADES_HEADER_STYLE }, 'Trades'),
    ...rows
  );
}
