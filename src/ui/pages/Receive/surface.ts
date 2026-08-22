import type { CSSProperties } from 'react';
import { useStore } from '@store-unit/react';
import { Theme, themeStore } from 'src/ui/features/appearance';
import {
  QUEST_BACKGROUND_COLOR,
  QUEST_GRADIENT_OPACITY,
  QUEST_PATTERN_OPACITY,
} from 'src/ui/shared/questBackground';

/**
 * The frosted-glass rows and the tinted background need two different alpha
 * ramps rather than one: on light the glass lifts toward white, on dark it
 * settles into a white haze, and a single value can't do both. None of the
 * theme's own custom properties covers that, so the pairs are declared here.
 *
 * The web app resolves the same pairs in CSS, because its `useTheme()` settles
 * in an effect and a dialog opened in dark mode would paint one light frame
 * first. Here `themeStore` is populated synchronously at module load, so
 * reading it during render is already correct on the first paint — and a CSS
 * media query wouldn't work anyway, since the dark class name is hashed by the
 * CSS-modules pipeline and can't be named from another stylesheet.
 */
const SURFACE_VARIABLES = {
  [Theme.light]: {
    '--quest-background-color': QUEST_BACKGROUND_COLOR.light,
    '--quest-gradient-opacity': QUEST_GRADIENT_OPACITY.light,
    '--quest-pattern-opacity': QUEST_PATTERN_OPACITY.light,
    '--glass-fill': 'rgba(255, 255, 255, 0.58)',
    '--glass-fill-hover': 'rgba(255, 255, 255, 0.92)',
    '--glass-line': 'rgba(255, 255, 255, 0.72)',
    '--glass-shadow': '0 8px 24px rgba(0, 0, 0, 0.12)',
  },
  [Theme.dark]: {
    '--quest-background-color': QUEST_BACKGROUND_COLOR.dark,
    '--quest-gradient-opacity': QUEST_GRADIENT_OPACITY.dark,
    '--quest-pattern-opacity': QUEST_PATTERN_OPACITY.dark,
    '--glass-fill': 'rgba(255, 255, 255, 0.07)',
    '--glass-fill-hover': 'rgba(255, 255, 255, 0.17)',
    '--glass-line': 'rgba(255, 255, 255, 0.1)',
    '--glass-shadow': '0 8px 24px rgba(0, 0, 0, 0.4)',
  },
} as Record<Theme, CSSProperties>;

/** Applied once, on the element that wraps both the tint and the content. */
export function useReceiveSurfaceVariables() {
  const { theme } = useStore(themeStore);
  return SURFACE_VARIABLES[theme];
}
