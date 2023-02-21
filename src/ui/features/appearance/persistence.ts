import { preferenceStore } from './preference-store';
import type { State } from './preference-store';

const key = 'color-scheme-2022-12-26';

export function persist() {
  return preferenceStore.on('change', (state) => {
    localStorage.setItem(key, JSON.stringify(state));
  });
}

export function retrieve(): State | null {
  /**
   * We use localStorage here because it's synchronous,
   * and it's very important to immediately (synchronously) retrieve the theme
   * preference to avoid flickering on UI startup
   *
   * TODO: Maybe we should still mirror (duplicate, not move) this state to
   * background's GlobalPreferences, so that in case we ever implement
   * exporting app state, theme preference will be exported, too.
   */
  const value = localStorage.getItem(key);
  return value ? JSON.parse(value) : null;
}
