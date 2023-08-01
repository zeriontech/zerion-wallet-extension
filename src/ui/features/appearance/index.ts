import { followTheme } from './theme-store';
import { persist } from './persistence';

export * from './preference-store';
export * from './theme-store';
export * from './persistence';
export * from './Theme';
export * from './ThemeState';
export * from './ThemeStore';

export function initialize() {
  followTheme();
  persist();
}
