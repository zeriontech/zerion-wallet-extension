import 'normalize.css';
import 'src/ui/style/theme.module.css';
import 'src/ui/style/fonts.module.css';
import { useLayoutEffect } from 'react';
import React from 'react';
import { ThemeStore, themeStore } from 'src/ui/features/appearance';
import { useStore } from '@store-unit/react';

export function DesignTheme({
  bodyClassList = [],
}: {
  bodyClassList?: string[];
}) {
  useLayoutEffect(() => {
    if (bodyClassList?.length) {
      document.body.classList.add(...bodyClassList);
      return () => {
        document.body.classList.remove(...bodyClassList);
      };
    }
  }, [bodyClassList]);
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
