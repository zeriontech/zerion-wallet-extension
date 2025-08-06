import type React from 'react';
import { useCallback } from 'react';

export function useSearchKeyboardNavigation({
  itemClassName,
  searchRef,
}: {
  itemClassName: string;
  searchRef: React.MutableRefObject<HTMLInputElement | null>;
}) {
  const focusSearchInput = useCallback(() => {
    if (searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchRef]);

  const selectNext = useCallback(() => {
    const activeElement = document.activeElement as
      | HTMLInputElement
      | HTMLButtonElement;
    let index: number | null = null;
    if (activeElement === searchRef.current) {
      index = -1;
    }
    if (activeElement?.dataset?.class === itemClassName) {
      index = Number((activeElement as HTMLButtonElement).dataset.index);
    }
    if (index != null) {
      const nextItem = document.querySelector<HTMLButtonElement>(
        `button[data-class='${itemClassName}'][data-index='${
          index + 1
        }'], a[data-class='${itemClassName}'][data-index='${index + 1}']`
      );
      if (nextItem) {
        nextItem.focus();
      }
    }
  }, [itemClassName, searchRef]);

  const selectPrev = useCallback(() => {
    const activeElement = document.activeElement as
      | HTMLInputElement
      | HTMLButtonElement;
    let index: number | null = null;
    if (activeElement?.dataset?.class === itemClassName) {
      index = Number((activeElement as HTMLButtonElement).dataset.index);
    }
    if (index != null && index > 0) {
      const prevItem = document.querySelector<HTMLButtonElement>(
        `button[data-class='${itemClassName}'][data-index='${
          index - 1
        }'], a[data-class='${itemClassName}'][data-index='${index - 1}']`
      );
      if (prevItem) {
        prevItem.focus();
      }
    }
    if (index === 0) {
      focusSearchInput();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [focusSearchInput, itemClassName]);

  return { selectNext, selectPrev, focusSearchInput };
}
