import { Store } from 'src/shared/store/store';
import { Theme } from './Theme';
import type { ThemeState } from './ThemeState';

export class ThemeStore extends Store<ThemeState> {
  static isDark(state: ThemeState) {
    return state.theme === Theme.dark;
  }

  static isLight(state: ThemeState) {
    return state.theme === Theme.light;
  }
}
