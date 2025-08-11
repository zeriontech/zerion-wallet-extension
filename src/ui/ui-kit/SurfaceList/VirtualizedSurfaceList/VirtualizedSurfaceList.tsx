import React, { useCallback, useContext } from 'react';
import type { Range } from '@tanstack/react-virtual';
import {
  useVirtualizer,
  useWindowVirtualizer,
  defaultRangeExtractor,
} from '@tanstack/react-virtual';
import { UIContext } from 'src/ui/components/UIContext';
import type { Item } from '../SurfaceList';
import { SurfaceList } from '../SurfaceList';

interface Props {
  items: Item[];
  overscan?: number;
  estimateSize: (index: number) => number;
  style?: React.CSSProperties;
  stickyFirstElement?: boolean;
}

const getRangeExtractor = (
  range: Range,
  stickyFirstElement?: boolean
): number[] => {
  if (!stickyFirstElement) {
    return defaultRangeExtractor(range);
  }
  const next = new Set([0, ...defaultRangeExtractor(range)]);
  return [...next].sort((a, b) => a - b);
};

function getItemStyles({
  isSticky,
  offset,
  height,
  style,
}: {
  isSticky: boolean;
  offset: number;
  height: number;
  style?: React.CSSProperties;
}): React.CSSProperties {
  return {
    ...(isSticky
      ? { position: 'sticky', zIndex: 1 }
      : {
          position: 'absolute',
          transform: `translateY(${offset}px)`,
        }),
    top: 0,
    left: 0,
    width: '100%',
    height: `${height}px`,
    ...style,
  };
}

export function WindowVirtualizedSurfaceList({
  items,
  overscan,
  estimateSize,
  style,
  stickyFirstElement,
}: Props) {
  const listRef = React.useRef<HTMLDivElement | null>(null);

  const windowVirtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize,
    overscan,
    scrollMargin: listRef.current?.offsetTop ?? 0,
    rangeExtractor: useCallback(
      (range: Range) => getRangeExtractor(range, stickyFirstElement),
      [stickyFirstElement]
    ),
  });

  return (
    <SurfaceList
      ref={listRef}
      style={{
        height: windowVirtualizer.getTotalSize(),
        position: 'relative',
        ...style,
      }}
      items={windowVirtualizer.getVirtualItems().map((virtualItem, index) => {
        const { style, ...item } = items[virtualItem.index];
        return {
          ...item,
          key: virtualItem.key.toString(),
          style: getItemStyles({
            isSticky: Boolean(stickyFirstElement && index === 0),
            offset: virtualItem.start - windowVirtualizer.options.scrollMargin,
            height: virtualItem.size,
            style,
          }),
        };
      })}
    />
  );
}

export function DialogVirtualizedSurfaceList({
  items,
  overscan,
  estimateSize,
  style,
  stickyFirstElement,
}: Props) {
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const { uiScrollRootElement } = useContext(UIContext);

  const dialogVirtualizer = useVirtualizer({
    count: items.length,
    estimateSize,
    overscan,
    scrollMargin: listRef.current?.offsetTop ?? 0,
    getScrollElement: () => uiScrollRootElement,
    rangeExtractor: useCallback(
      (range: Range) => getRangeExtractor(range, stickyFirstElement),
      [stickyFirstElement]
    ),
  });

  return (
    <SurfaceList
      ref={listRef}
      style={{
        height: dialogVirtualizer.getTotalSize(),
        position: 'relative',
        ...style,
      }}
      items={dialogVirtualizer.getVirtualItems().map((virtualItem, index) => {
        const { style, ...item } = items[virtualItem.index];
        return {
          ...item,
          key: virtualItem.key.toString(),
          style: getItemStyles({
            isSticky: Boolean(stickyFirstElement && index === 0),
            offset: virtualItem.start - dialogVirtualizer.options.scrollMargin,
            height: virtualItem.size,
            style,
          }),
        };
      })}
    />
  );
}

export function VirtualizedSurfaceList({
  context = 'window',
  ...props
}: Props & {
  context?: 'window' | 'dialog';
}) {
  return context === 'window' ? (
    <WindowVirtualizedSurfaceList {...props} />
  ) : (
    <DialogVirtualizedSurfaceList {...props} />
  );
}
