import type { DistributionItem, DistributionTile } from './types';

/** Groups below this share of the chart total fold into the `Others` tile. */
export const OTHERS_THRESHOLD = 0.005;

/** A chart needs at least this many tiles (Others counts as one) to render. */
export const MIN_TILES = 3;

const OTHERS_ID = '__others__';

/**
 * Turn raw adapter items into the displayed item list:
 * - drop non-positive values,
 * - sort descending,
 * - fold everything below {OTHERS_THRESHOLD} of the total into a single
 *   trailing `Others` item.
 *
 * The result is ready for {computeTiles}; `Others` (if present) is always last.
 */
export function buildDistributionItems(
  raw: DistributionItem[],
  { othersThreshold = OTHERS_THRESHOLD }: { othersThreshold?: number } = {}
): DistributionItem[] {
  const positive = raw.filter((item) => item.value > 0);
  const total = positive.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) {
    return [];
  }

  const big: DistributionItem[] = [];
  const small: DistributionItem[] = [];
  for (const item of positive) {
    (item.value / total < othersThreshold ? small : big).push(item);
  }
  big.sort((a, b) => b.value - a.value);

  if (small.length > 0) {
    big.push({
      id: OTHERS_ID,
      label: 'Others',
      value: small.reduce((sum, item) => sum + item.value, 0),
      isOthers: true,
    });
  }
  return big;
}

/**
 * Worst (largest) aspect ratio in a row of tile areas laid along a side of
 * length `side`. Lower is better; 1 is a perfect square. This is the metric
 * the squarified algorithm greedily minimizes (Bruls/Huizing/van Wijk 2000).
 */
function worstAspectRatio(areas: number[], side: number): number {
  const sum = areas.reduce((acc, area) => acc + area, 0);
  if (sum <= 0) {
    return Infinity;
  }
  const max = Math.max(...areas);
  const min = Math.min(...areas);
  const side2 = side * side;
  const sum2 = sum * sum;
  return Math.max((side2 * max) / sum2, sum2 / (side2 * min));
}

/**
 * Squarified treemap layout (Bruls/Huizing/van Wijk 2000). Each tile's pixel
 * area is proportional to its share, and tiles are packed into rows along the
 * rectangle's shorter side so their aspect ratios stay as close to square as
 * possible. A row is closed as soon as appending the next item would worsen
 * its worst aspect ratio.
 *
 * Expects `items` already sorted/folded by {buildDistributionItems}.
 */
export function computeTiles(
  items: DistributionItem[],
  width: number,
  height: number
): DistributionTile[] {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0 || width <= 0 || height <= 0) {
    return [];
  }

  const tiles: DistributionTile[] = [];
  const area = width * height;
  // Pre-scale each item to its pixel area so layout math is in pixels.
  const queue = items.map((item) => ({
    item,
    area: (item.value / total) * area,
  }));
  let rect = { x: 0, y: 0, w: width, h: height };
  let row: { item: DistributionItem; area: number }[] = [];

  // Lay the accumulated row into a band along the rect's shorter side, then
  // shrink the rect by the band so the next row lays into the leftover.
  const flushRow = () => {
    const rowArea = row.reduce((sum, cell) => sum + cell.area, 0);
    if (rowArea <= 0) {
      return;
    }
    if (rect.w >= rect.h) {
      // Shorter side is the height: lay the row as a vertical column on the left.
      const colW = rowArea / rect.h;
      let y = rect.y;
      for (const cell of row) {
        const tileH = (cell.area / rowArea) * rect.h;
        tiles.push({ item: cell.item, x: rect.x, y, w: colW, h: tileH });
        y += tileH;
      }
      rect = { x: rect.x + colW, y: rect.y, w: rect.w - colW, h: rect.h };
    } else {
      // Shorter side is the width: lay the row as a horizontal band on top.
      const rowH = rowArea / rect.w;
      let x = rect.x;
      for (const cell of row) {
        const tileW = (cell.area / rowArea) * rect.w;
        tiles.push({ item: cell.item, x, y: rect.y, w: tileW, h: rowH });
        x += tileW;
      }
      rect = { x: rect.x, y: rect.y + rowH, w: rect.w, h: rect.h - rowH };
    }
    row = [];
  };

  while (queue.length > 0) {
    const next = queue[0];
    const side = Math.min(rect.w, rect.h);
    const current = row.map((cell) => cell.area);
    // Keep adding to the row while it keeps (or improves) the aspect ratio.
    if (
      row.length === 0 ||
      worstAspectRatio([...current, next.area], side) <=
        worstAspectRatio(current, side)
    ) {
      row.push(next);
      queue.shift();
    } else {
      flushRow();
    }
  }
  flushRow();

  return tiles;
}
