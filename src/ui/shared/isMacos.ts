/**
 * Detects if the current platform is macOS
 */
export function isMacOS(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  // Use userAgent as navigator.platform is deprecated
  const userAgent = window.navigator.userAgent;
  return /Mac|iPhone|iPad|iPod/.test(userAgent);
}
