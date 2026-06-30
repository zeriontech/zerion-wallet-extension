import { useEffect, useMemo, useState } from 'react';
import type { DistributionItem } from './types';

type Rgb = [number, number, number];

/**
 * Crisp, instant accents for popular chains (no extraction flicker). Keyed by
 * the chain id used in `positionsChainsDistribution` (defi-sdk names). Unknown
 * chains fall through to client-side extraction (see ADR-0003).
 */
export const HARDCODED_CHAIN_ACCENTS: Record<string, Rgb> = {
  ethereum: [98, 126, 234],
  polygon: [130, 71, 229],
  'polygon-zkevm': [130, 71, 229],
  arbitrum: [40, 160, 240],
  optimism: [255, 4, 32],
  base: [0, 82, 255],
  'binance-smart-chain': [240, 185, 11],
  avalanche: [232, 65, 66],
  fantom: [25, 105, 255],
  xdai: [4, 132, 118],
  gnosis: [4, 132, 118],
  aurora: [112, 209, 0],
  zksync: [56, 102, 243],
  'zksync-era': [56, 102, 243],
  linea: [40, 40, 40],
  scroll: [255, 153, 102],
  zora: [0, 82, 255],
  blast: [252, 220, 60],
  mantle: [40, 40, 40],
  celo: [53, 208, 127],
  solana: [153, 69, 255],
  zero: [40, 40, 40],
};

/** Per-URL cache; `null` means extraction ran but produced no usable color. */
const accentCache = new Map<string, Rgb | null>();

/**
 * Pick a representative accent from RGBA pixel data: bucket saturated,
 * non-extreme pixels into a coarse color grid and return the densest bucket's
 * average. Returns `null` when nothing usable is found (e.g. a greyscale logo).
 */
function pickDominant(data: Uint8ClampedArray): Rgb | null {
  const buckets = new Map<
    number,
    { r: number; g: number; b: number; n: number }
  >();
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 128) {
      continue; // transparent
    }
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    if (saturation < 0.15) {
      continue; // near-greyscale — no brand color
    }
    if (max < 24 || min > 232) {
      continue; // near-black / near-white
    }
    // Quantize each channel to 3 bits (8 levels) → a 9-bit bucket key.
    const key = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
    const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 };
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    bucket.n += 1;
    buckets.set(key, bucket);
  }

  let best: { r: number; g: number; b: number; n: number } | null = null;
  for (const bucket of buckets.values()) {
    if (!best || bucket.n > best.n) {
      best = bucket;
    }
  }
  if (!best) {
    return null;
  }
  return [
    Math.round(best.r / best.n),
    Math.round(best.g / best.n),
    Math.round(best.b / best.n),
  ];
}

/**
 * Load an icon into an offscreen canvas and sample its dominant color.
 * Resolves `null` on any failure (missing image, CORS block, no usable color).
 */
function extractDominantColor(url: string): Promise<Rgb | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const size = 24;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        resolve(pickDominant(ctx.getImageData(0, 0, size, size).data));
      } catch {
        resolve(null); // tainted canvas (CORS) etc.
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Resolve a `[r,g,b]` accent (or `null` → neutral) per item:
 * hardcoded `accent` wins; otherwise the icon is decoded once and cached.
 * Extraction is async, so tiles paint neutral first and colorize on resolve.
 */
export function useAccentColors(
  items: DistributionItem[]
): Record<string, Rgb | null> {
  const [version, setVersion] = useState(0);

  const signature = items
    .map((item) => `${item.id}:${item.accent ? 'h' : item.iconUrl ?? ''}`)
    .join('|');

  useEffect(() => {
    let cancelled = false;
    const pending = items.filter(
      (item) =>
        !item.accent &&
        !item.isOthers &&
        item.iconUrl &&
        !accentCache.has(item.iconUrl)
    );
    if (pending.length === 0) {
      return;
    }
    Promise.all(
      pending.map(async (item) => {
        const color = await extractDominantColor(item.iconUrl as string);
        accentCache.set(item.iconUrl as string, color);
      })
    ).then(() => {
      if (!cancelled) {
        // Bump version so the memo below recomputes with the freshly cached
        // colors (the signature is unchanged, so it alone wouldn't re-run).
        setVersion((value) => value + 1);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return useMemo(() => {
    const result: Record<string, Rgb | null> = {};
    for (const item of items) {
      if (item.accent) {
        result[item.id] = item.accent;
      } else if (item.iconUrl && accentCache.has(item.iconUrl)) {
        result[item.id] = accentCache.get(item.iconUrl) ?? null;
      } else {
        result[item.id] = null;
      }
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, version]);
}

/** Pale-tint tile background from an accent; neutral when no color resolved. */
export function tintBackground(accent: Rgb | null | undefined): string {
  if (!accent) {
    return 'var(--neutral-200)';
  }
  const [r, g, b] = accent;
  return `rgba(${r}, ${g}, ${b}, 0.16)`;
}
