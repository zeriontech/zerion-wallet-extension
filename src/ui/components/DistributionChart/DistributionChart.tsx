import React, {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useStore } from '@store-unit/react';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue/formatCurrencyValue';
import { preferenceStore } from 'src/ui/features/appearance/preference-store';
import { Image2 } from 'src/ui/ui-kit/MediaFallback/MediaFallback2';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { useAccentColors, tintBackground } from './accentColor';
import {
  buildDistributionItems,
  computeTiles,
  MIN_TILES,
} from './sliceAndDice';
import type { DistributionItem } from './types';

const HEIGHT = 180;
const GAP = 4;
const RADIUS = 8;
const ICON_SIZE_SM = 12;
const ICON_SIZE_LG = 24;
// An icon needs breathing room; only show it once the inset tile clears the
// small icon on both axes so it never clips a thin slice. Tiles that clear the
// large icon get the bigger 24px rendering.
const ICON_TILE_MIN = ICON_SIZE_SM + 6;
const ICON_TILE_LG = ICON_SIZE_LG + 12;
// Once an inset tile clears this on both axes it can host the full label
// (icon + title + numbers) inline, centered — making its own tooltip redundant.
const LABEL_TILE_MIN_W = 76;
const LABEL_TILE_MIN_H = 72;

function formatShare(share: number): string {
  return `${share < 0.1 ? '<0.1' : share.toFixed(share < 10 ? 1 : 0)}%`;
}

/** Pick the icon size that fits the inset tile (0 = no icon). */
function iconSizeForTile(w: number, h: number): number {
  const min = Math.min(w, h);
  if (min >= ICON_TILE_LG) {
    return ICON_SIZE_LG;
  }
  if (min >= ICON_TILE_MIN) {
    return ICON_SIZE_SM;
  }
  return 0;
}

function TileIcon({
  src,
  label,
  node,
  size,
}: {
  src?: string | null;
  label: string;
  node?: ReactNode;
  size: number;
}) {
  if (node) {
    return <>{node}</>;
  }
  const radius = size >= ICON_SIZE_LG ? 6 : 3;
  return (
    <Image2
      src={src ?? undefined}
      alt={label}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        display: 'block',
        objectFit: 'cover',
      }}
      renderError={() => (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: 'var(--neutral-300)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <UIText kind="caption/accent" color="var(--neutral-700)">
            {(label || '?').slice(0, 1).toUpperCase()}
          </UIText>
        </div>
      )}
    />
  );
}

function Tooltip({
  item,
  share,
  currency,
  x,
  y,
  containerWidth,
}: {
  item: DistributionItem;
  share: number;
  currency: string;
  x: number;
  y: number;
  containerWidth: number;
}) {
  const { hideBalances } = useStore(preferenceStore);
  const ESTIMATED_WIDTH = 160;
  const OFFSET = 4;
  // Follow the cursor on its right; when there isn't room, flip to the left and
  // anchor the card's right edge to the cursor so it stays glued to it (rather
  // than pinning to a fixed inset and drifting away from the pointer).
  const flipLeft = x + OFFSET + ESTIMATED_WIDTH > containerWidth;
  const horizontal = flipLeft
    ? { right: Math.max(0, containerWidth - x + OFFSET) }
    : { left: x + OFFSET };
  return (
    <div
      style={{
        position: 'absolute',
        ...horizontal,
        top: Math.max(0, y - 12),
        transform: 'translateY(-100%)',
        pointerEvents: 'none',
        zIndex: 2,
        backgroundColor: 'var(--white)',
        border: '1px solid var(--neutral-200)',
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.12)',
        borderRadius: 8,
        padding: '6px 8px',
        maxWidth: ESTIMATED_WIDTH,
        whiteSpace: 'nowrap',
      }}
    >
      <UIText kind="caption/accent" color="var(--black)">
        {item.label}
      </UIText>
      <HStack gap={6} alignItems="center">
        {hideBalances ? null : (
          <UIText kind="caption/regular" color="var(--neutral-700)">
            {formatCurrencyValue(item.value, 'en', currency)}
          </UIText>
        )}
        <UIText kind="caption/regular" color="var(--neutral-500)">
          {formatShare(share)}
        </UIText>
      </HStack>
    </div>
  );
}

/**
 * Full label rendered inside a tile that's large enough: icon + title +
 * value/share, vertically centered. Mirrors the tooltip content so a big tile
 * can carry it inline instead of needing a hover card.
 */
function TileContent({
  item,
  share,
  currency,
  iconSize,
  maxWidth,
}: {
  item: DistributionItem;
  share: number;
  currency: string;
  iconSize: number;
  maxWidth: number;
}) {
  const { hideBalances } = useStore(preferenceStore);
  return (
    <VStack
      gap={4}
      style={{ justifyItems: 'center', textAlign: 'center', maxWidth }}
    >
      {iconSize > 0 ? (
        <TileIcon
          src={item.iconUrl}
          label={item.label}
          node={item.iconNode}
          size={iconSize}
        />
      ) : null}
      <UIText
        kind="caption/accent"
        color="var(--black)"
        style={{
          maxWidth,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {item.label}
      </UIText>
      <HStack gap={6} alignItems="center">
        {hideBalances ? null : (
          <UIText kind="caption/regular" color="var(--neutral-700)">
            {formatCurrencyValue(item.value, 'en', currency)}
          </UIText>
        )}
        <UIText kind="caption/regular" color="var(--neutral-500)">
          {formatShare(share)}
        </UIText>
      </HStack>
    </VStack>
  );
}

function ChartHeading({
  title,
  titleIcon,
}: {
  title: string;
  titleIcon?: ReactNode;
}) {
  return (
    <HStack gap={8} alignItems="center">
      {titleIcon}
      <UIText kind="body/accent">{title}</UIText>
    </HStack>
  );
}

/**
 * Placeholder shown while the data is loading. Mimics the slice-and-dice
 * treemap with a few static, rounded neutral tiles so the section keeps its
 * shape instead of collapsing to an empty gap.
 */
function DistributionChartSkeleton({
  title,
  titleIcon,
}: {
  title: string;
  titleIcon?: ReactNode;
}) {
  const tile = {
    borderRadius: RADIUS,
    backgroundColor: 'var(--neutral-200)',
  } as const;
  return (
    <VStack gap={12} style={{ padding: '0 16px' }}>
      <ChartHeading title={title} titleIcon={titleIcon} />
      <div style={{ display: 'flex', gap: GAP, width: '100%', height: HEIGHT }}>
        <div style={{ ...tile, flex: 3 }} />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: GAP,
            flex: 2,
          }}
        >
          <div style={{ ...tile, flex: 3 }} />
          <div style={{ ...tile, flex: 2 }} />
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: GAP,
            flex: 1,
          }}
        >
          <div style={{ ...tile, flex: 2 }} />
          <div style={{ ...tile, flex: 1 }} />
          <div style={{ ...tile, flex: 1 }} />
        </div>
      </div>
    </VStack>
  );
}

/**
 * Generic, data-agnostic distribution treemap: a single `W×100px` bar carved
 * into rounded, gapped tiles by the alternating slice-and-dice layout. Shows a
 * skeleton while `isLoading`; otherwise renders nothing until its data passes
 * the {MIN_TILES} gate.
 */
export function DistributionChart({
  title,
  titleIcon,
  items: rawItems,
  currency,
  isLoading,
  onSelect,
}: {
  title: string;
  titleIcon?: ReactNode;
  items: DistributionItem[];
  currency: string;
  isLoading?: boolean;
  /**
   * Called when a tile is clicked. The aggregated "Others" tile is inert (it
   * maps to no single network/protocol), so it never fires this.
   */
  onSelect?: (item: DistributionItem) => void;
}) {
  const items = useMemo(() => buildDistributionItems(rawItems), [rawItems]);
  const accents = useAccentColors(items);
  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.value, 0),
    [items]
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }
    const update = () => setWidth(element.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const tiles = useMemo(
    () => (width > 0 ? computeTiles(items, width, HEIGHT) : []),
    [items, width]
  );

  const [hovered, setHovered] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);

  // Gate: while loading, hold the section's shape with a skeleton; once
  // settled, render nothing until the data resolves to enough tiles.
  if (items.length < MIN_TILES) {
    return isLoading ? (
      <DistributionChartSkeleton title={title} titleIcon={titleIcon} />
    ) : null;
  }

  const hoveredTile = hovered
    ? tiles.find((tile) => tile.item.id === hovered.id)
    : null;

  return (
    <VStack gap={12} style={{ padding: '0 16px' }}>
      <ChartHeading title={title} titleIcon={titleIcon} />
      <div
        ref={containerRef}
        style={{ position: 'relative', width: '100%', height: HEIGHT }}
        onMouseLeave={() => setHovered(null)}
      >
        {tiles.map((tile) => {
          const w = tile.w - GAP;
          const h = tile.h - GAP;
          const iconSize = iconSizeForTile(w, h);
          const showLabel =
            !tile.item.isOthers &&
            w >= LABEL_TILE_MIN_W &&
            h >= LABEL_TILE_MIN_H;
          const showIcon =
            !showLabel &&
            !tile.item.isOthers &&
            (tile.item.iconUrl || tile.item.iconNode) &&
            iconSize > 0;
          const clickable = Boolean(onSelect) && !tile.item.isOthers;
          return (
            <div
              key={tile.item.id}
              role={clickable ? 'button' : undefined}
              onClick={clickable ? () => onSelect?.(tile.item) : undefined}
              onMouseEnter={() =>
                setHovered({ id: tile.item.id, x: tile.x, y: tile.y })
              }
              onMouseMove={(event) => {
                const rect = containerRef.current?.getBoundingClientRect();
                if (!rect) {
                  return;
                }
                setHovered({
                  id: tile.item.id,
                  x: event.clientX - rect.left,
                  y: event.clientY - rect.top,
                });
              }}
              style={{
                position: 'absolute',
                left: tile.x + GAP / 2,
                top: tile.y + GAP / 2,
                width: Math.max(0, w),
                height: Math.max(0, h),
                borderRadius: RADIUS,
                backgroundColor: tile.item.isOthers
                  ? 'var(--neutral-200)'
                  : tintBackground(accents[tile.item.id]),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                cursor: clickable ? 'pointer' : undefined,
              }}
            >
              {showLabel ? (
                <TileContent
                  item={tile.item}
                  share={total > 0 ? (tile.item.value / total) * 100 : 0}
                  currency={currency}
                  iconSize={iconSize || ICON_SIZE_LG}
                  maxWidth={w - 8}
                />
              ) : showIcon ? (
                <TileIcon
                  src={tile.item.iconUrl}
                  label={tile.item.label}
                  node={tile.item.iconNode}
                  size={iconSize}
                />
              ) : null}
            </div>
          );
        })}
        {hovered &&
        hoveredTile &&
        !(
          !hoveredTile.item.isOthers &&
          hoveredTile.w - GAP >= LABEL_TILE_MIN_W &&
          hoveredTile.h - GAP >= LABEL_TILE_MIN_H
        ) ? (
          <Tooltip
            item={hoveredTile.item}
            share={total > 0 ? (hoveredTile.item.value / total) * 100 : 0}
            currency={currency}
            x={hovered.x}
            y={hovered.y}
            containerWidth={width}
          />
        ) : null}
      </div>
    </VStack>
  );
}
