const DIACRITICS = /[\u0300-\u036f]/g;

/**
 * Substring test that ignores diacritics, vendored from normalized-contains
 * (same case-sensitive behavior as the original package).
 */
export function normalizedContains(haystack: string, needle: string) {
  const normalize = (value: string) => value.normalize('NFD').replace(DIACRITICS, '');
  return normalize(haystack).includes(normalize(needle));
}
