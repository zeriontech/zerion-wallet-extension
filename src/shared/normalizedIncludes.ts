const DIACRITICS = /[\u0300-\u036f]/g;

/**
 * Case-insensitive substring test that ignores diacritics, so typing "curacao"
 * matches "Curaçao" and "aland" matches "Åland Islands".
 *
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize
 */
export function normalizedIncludes(haystack: string, needle: string) {
  const normalize = (value: string) =>
    value.normalize('NFD').replace(DIACRITICS, '').toLowerCase();
  return normalize(haystack).includes(normalize(needle));
}
