export function isSidepanelSupported() {
  return globalThis.chrome && 'sidePanel' in chrome;
}
