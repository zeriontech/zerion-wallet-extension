export function getBackOrHome(): number | string {
  if ('navigation' in window) {
    const { currentEntry } = window.navigation;
    const entries = window.navigation.entries();
    if (entries.length === 1 || entries[0] === currentEntry) {
      return '/';
    } else {
      return -1;
    }
  } else {
    return -1;
  }
}
