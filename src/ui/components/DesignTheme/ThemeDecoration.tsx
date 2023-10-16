import { useStore } from '@store-unit/react';
import React from 'react';
import { ThemeStore, themeStore } from 'src/ui/features/appearance';

export function ThemeDecoration() {
  const themeState = useStore(themeStore);

  if (ThemeStore.isDark(themeState)) {
    /** Build a visual outline for dark mode and popup view only */
    return (
      <div
        className="popup-only"
        style={{
          position: 'fixed',
          inset: 0,
          borderInline: '1px solid var(--neutral-300)',
          pointerEvents: 'none',
          zIndex: 'var(--over-layout-index)',
        }}
      />
    );
  }
  return null;
}
