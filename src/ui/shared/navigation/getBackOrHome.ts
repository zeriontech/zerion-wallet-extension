export function getBackOrHome(home = '/'): number | string {
  if ('navigation' in window) {
    const { currentEntry } = window.navigation;
    const entries = window.navigation.entries();
    if (entries.length === 1 || entries[0] === currentEntry) {
      return home;
    } else {
      return -1;
    }
  } else {
    return -1;
  }
}
