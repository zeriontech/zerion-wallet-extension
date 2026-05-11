import React, { useLayoutEffect, useRef, useState } from 'react';
import { ComboboxList } from '@ariakit/react';
import { useVirtualizer } from '@tanstack/react-virtual';
import * as styles from './styles.module.css';

const TOKEN_ROW_HEIGHT = 68;
const SECTION_HEADER_HEIGHT = 32;

export type VirtualListItem<T> =
  | { kind: 'item'; key: string; data: T }
  | { kind: 'header'; key: string; label: string };

function findScrollParent(element: HTMLElement | null): HTMLElement | null {
  let node: HTMLElement | null = element?.parentElement ?? null;
  while (node) {
    const { overflowY } = window.getComputedStyle(node);
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

export function VirtualizedTokenList<T>({
  items,
  renderItem,
  renderHeader,
}: {
  items: VirtualListItem<T>[];
  renderItem: (data: T, index: number) => React.ReactNode;
  renderHeader?: (label: string) => React.ReactNode;
}) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setScrollElement(findScrollParent(listRef.current));
  }, []);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollElement,
    estimateSize: (index) =>
      items[index].kind === 'header' ? SECTION_HEADER_HEIGHT : TOKEN_ROW_HEIGHT,
    overscan: 6,
    scrollMargin: listRef.current?.offsetTop ?? 0,
    getItemKey: (index) => items[index].key,
  });

  return (
    <ComboboxList
      alwaysVisible
      ref={listRef}
      className={styles.tokenList}
      style={{
        height: virtualizer.getTotalSize(),
        position: 'relative',
        width: '100%',
      }}
    >
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const item = items[virtualRow.index];
        const offset = virtualRow.start - virtualizer.options.scrollMargin;
        return (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${offset}px)`,
            }}
          >
            {item.kind === 'header'
              ? renderHeader?.(item.label)
              : renderItem(item.data, virtualRow.index)}
          </div>
        );
      })}
    </ComboboxList>
  );
}
