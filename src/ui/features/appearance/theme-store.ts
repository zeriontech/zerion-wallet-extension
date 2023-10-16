import { preferenceStore, ThemePreference } from './preference-store';
import { ThemeStore } from './ThemeStore';
import { Theme } from './Theme';
import { applyTheme } from './applyTheme';

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

export function followTheme() {
  applyTheme(themeStore.getState().theme);
  return themeStore.on('change', ({ theme }) => {
    applyTheme(theme);
  });
}
