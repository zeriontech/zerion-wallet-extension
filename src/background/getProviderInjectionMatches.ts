const ALL_URLS = '<all_urls>';

/**
 * Match patterns for registering the in-page provider script.
 * `undefined` means "register nothing": injection is paused on every site.
 */
export function getProviderInjectionMatches(
  allUrlsPause: { expires: number | null } | undefined,
  now: number,
): string[] | undefined {
  if (!allUrlsPause) {
    return [ALL_URLS];
  }
  const isPaused = allUrlsPause.expires == null || allUrlsPause.expires > now;
  return isPaused ? undefined : [ALL_URLS];
}
