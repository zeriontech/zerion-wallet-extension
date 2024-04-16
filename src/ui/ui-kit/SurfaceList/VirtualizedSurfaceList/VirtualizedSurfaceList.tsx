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

export function VirtualizedSurfaceList({
  items,
  overscan,
  estimateSize,
  style,
  context = 'window',
  stickyFirstElement,
}: {
  items: Item[];
  overscan?: number;
  estimateSize: (index: number) => number;
  style?: React.CSSProperties;
  context?: 'window' | 'dialog';
  stickyFirstElement?: boolean;
}) {
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const { uiScrollRootElement } = useContext(UIContext);

  const windowVirtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize,
    overscan,
    scrollMargin: listRef.current?.offsetTop ?? 0,
    rangeExtractor: useCallback(
      (range: Range) => {
        if (!stickyFirstElement) {
          return defaultRangeExtractor(range);
        }
        const next = new Set([0, ...defaultRangeExtractor(range)]);
        return [...next].sort((a, b) => a - b);
      },
      [stickyFirstElement]
    ),
  });

  const dialogVirtualizer = useVirtualizer({
    count: items.length,
    estimateSize,
    overscan,
    scrollMargin: listRef.current?.offsetTop ?? 0,
    getScrollElement: () => uiScrollRootElement,
    rangeExtractor: useCallback(
      (range: Range) => {
        if (!stickyFirstElement) {
          return defaultRangeExtractor(range);
        }
        const next = new Set([0, ...defaultRangeExtractor(range)]);
        return [...next].sort((a, b) => a - b);
      },
      [stickyFirstElement]
    ),
  });

  const virtualizer =
    context === 'window' ? windowVirtualizer : dialogVirtualizer;

  return (
    <SurfaceList
      ref={listRef}
      style={{
        height: virtualizer.getTotalSize(),
        position: 'relative',
        ...style,
      }}
      items={virtualizer.getVirtualItems().map((virtualItem, index) => {
        const { style: styleProp, ...item } = items[virtualItem.index];
        const style: React.CSSProperties = {
          ...(stickyFirstElement && index === 0
            ? { position: 'sticky', zIndex: 1 }
            : {
                position: 'absolute',
                transform: `translateY(${
                  virtualItem.start - virtualizer.options.scrollMargin
                }px)`,
              }),
          top: 0,
          left: 0,
          width: '100%',
          height: `${virtualItem.size}px`,
          ...styleProp,
        };
        return { ...item, key: virtualItem.key, style };
      })}
    />
  );
}
