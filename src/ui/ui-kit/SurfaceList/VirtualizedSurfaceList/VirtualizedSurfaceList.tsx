import React, { useContext } from 'react';
import { useVirtualizer, useWindowVirtualizer } from '@tanstack/react-virtual';
import { UIContext } from 'src/ui/components/UIContext';
import type { Item } from '../SurfaceList';
import { SurfaceList } from '../SurfaceList';

export function VirtualizedSurfaceList({
  items,
  overscan,
  estimateSize,
  style,
  context = 'window',
}: {
  items: Item[];
  overscan?: number;
  estimateSize: (index: number) => number;
  style?: React.CSSProperties;
  context?: 'window' | 'dialog';
}) {
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const { uiScrollRootElement } = useContext(UIContext);

  const windowVirtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize,
    overscan,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });
  const dialogVirtualizer = useVirtualizer({
    count: items.length,
    estimateSize,
    overscan,
    scrollMargin: listRef.current?.offsetTop ?? 0,
    getScrollElement: () => uiScrollRootElement,
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
      items={virtualizer.getVirtualItems().map((virtualItem) => {
        const { style: styleProp, ...item } = items[virtualItem.index];
        const style: React.CSSProperties = {
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${virtualItem.size}px`,
          transform: `translateY(${
            virtualItem.start - virtualizer.options.scrollMargin
          }px)`,
          ...styleProp,
        };
        return { ...item, key: virtualItem.key, style };
      })}
    />
  );
}
