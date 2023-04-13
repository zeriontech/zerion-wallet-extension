import React from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import type { Item } from '../SurfaceList';
import { SurfaceList } from '../SurfaceList';

export function VirtualizedSurfaceList({
  items,
  overscan,
  estimateSize,
}: {
  items: Item[];
  overscan?: number;
  estimateSize: (index: number) => number;
}) {
  const rowVirtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize,
    overscan,
  });
  return (
    <SurfaceList
      style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}
      items={rowVirtualizer.getVirtualItems().map((virtualItem) => {
        const { style: styleProp, ...item } = items[virtualItem.index];
        const style: React.CSSProperties = {
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${virtualItem.size}px`,
          transform: `translateY(${virtualItem.start}px)`,
          ...styleProp,
        };
        return { ...item, key: virtualItem.key, style };
      })}
    />
  );
}
