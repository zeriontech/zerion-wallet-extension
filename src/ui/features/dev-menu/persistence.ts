import type { DevMenuState } from './store-types';

const STORAGE_KEY = 'dev-menu-overrides';

export function retrieve(): Partial<DevMenuState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as Partial<DevMenuState>;
    }
    return null;
  } catch {
    return null;
  }
}

export function save(state: DevMenuState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}
