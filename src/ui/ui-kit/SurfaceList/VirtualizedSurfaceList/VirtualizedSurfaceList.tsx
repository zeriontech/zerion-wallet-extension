import React from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import type { Item } from '../SurfaceList';
import { SurfaceList } from '../SurfaceList';

export function VirtualizedSurfaceList({
  items,
  overscan,
  estimateSize,
  style,
}: {
  items: Item[];
  overscan?: number;
  estimateSize: (index: number) => number;
  style?: React.CSSProperties;
}) {
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize,
    overscan,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });
  return (
    <SurfaceList
      ref={listRef}
      style={{
        height: rowVirtualizer.getTotalSize(),
        position: 'relative',
        ...style,
      }}
      items={rowVirtualizer.getVirtualItems().map((virtualItem) => {
        const { style: styleProp, ...item } = items[virtualItem.index];
        const style: React.CSSProperties = {
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${virtualItem.size}px`,
          transform: `translateY(${
            virtualItem.start - rowVirtualizer.options.scrollMargin
          }px)`,
          ...styleProp,
        };
        return { ...item, key: virtualItem.key, style };
      })}
    />
  );
}
