import * as browserStorage from 'src/background/webapis/storage';
import { preferenceStore } from './preference-store';
import type { State } from './preference-store';

const key = 'color-scheme-2022-12-26';

export function persist() {
  return preferenceStore.on('change', (state) => {
    browserStorage.set(key, JSON.stringify(state));
  });
}

export async function retrieve(): Promise<State | undefined> {
  return browserStorage.get<State>(key);
}
