export function isChromeBrowser() {
  return Boolean(window.chrome) && navigator.vendor === 'Google Inc.';
}
