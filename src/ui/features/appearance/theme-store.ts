import { Store } from 'store-unit';
import s from 'src/ui/style/theme.module.css';
import { preferenceStore, ThemePreference } from './preference-store';

export enum Theme {
  light,
  dark,
}

function getSystemMode(colorSchemeMedia: MediaQueryList) {
  return colorSchemeMedia.matches ? Theme.dark : Theme.light;
}

function getTheme(
  preference: typeof preferenceStore,
  colorSchemeMedia: MediaQueryList
) {
  if (preference.getState().mode === ThemePreference.system) {
    return getSystemMode(colorSchemeMedia);
  }
  return preferenceStore.getState().mode === ThemePreference.dark
    ? Theme.dark
    : Theme.light;
}

const colorSchemeMedia = window.matchMedia('(prefers-color-scheme: dark)');

export const isSupported = true;

interface State {
  theme: Theme;
}

export class ThemeStore extends Store<State> {
  static isDark(state: State) {
    return state.theme === Theme.dark;
  }

  static isLight(state: State) {
    return state.theme === Theme.light;
  }
}

export const themeStore = new ThemeStore({
  theme: isSupported
    ? getTheme(preferenceStore, colorSchemeMedia)
    : Theme.light,
});

function safelySetTheme(theme: Theme) {
  if (!isSupported) {
    return;
  }
  if (themeStore.getState().theme === theme) {
    return;
  }
  themeStore.setState({ theme });
}

colorSchemeMedia.addEventListener('change', () => {
  safelySetTheme(getTheme(preferenceStore, colorSchemeMedia));
});

preferenceStore.on('change', () => {
  safelySetTheme(getTheme(preferenceStore, colorSchemeMedia));
});

// TODO: decide whether to use this or not
const invertClassnames = ['.theme-dark-invert'];

export function registerInvertClassname(className: string) {
  invertClassnames.push(className);
}

function applyTheme(theme: Theme) {
  if (theme === Theme.dark) {
    document.documentElement.classList.add(s['theme-dark']);
  } else {
    document.documentElement.classList.remove(s['theme-dark']);
  }
}

export function followTheme() {
  applyTheme(themeStore.getState().theme);
  return themeStore.on('change', ({ theme }) => {
    applyTheme(theme);
  });
}
