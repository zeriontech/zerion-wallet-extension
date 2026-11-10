/**
 * ZPI's hard cap for `hiddenFungibleIds` on wallet requests: more than this
 * many raw entries is a 400. The cap is a write-time gate for the persisted
 * list, never a reason to truncate an outgoing request.
 */
export const HIDDEN_FUNGIBLE_IDS_LIMIT = 500;

/**
 * The wire shape of the persisted hidden list:
 * drop empty entries, deduplicate exact ids, sort deterministically, keep the
 * original spelling/case, and never truncate.
 */
export function normalizeHiddenFungibleIds(ids: readonly string[] | null | undefined): string[] {
  return [...new Set((ids ?? []).filter((id) => id.length > 0))].sort();
}

/**
 * Returns params with a normalized `hiddenFungibleIds` body field, or with the
 * field removed when the effective list is empty. ZPI treats an omitted list
 * and an empty list the same, but omitting keeps the wire contract explicit.
 */
export function withNormalizedHiddenFungibleIds<T extends { hiddenFungibleIds?: string[] }>(
  params: T,
): Omit<T, 'hiddenFungibleIds'> & { hiddenFungibleIds?: string[] } {
  const { hiddenFungibleIds, ...rest } = params;
  const normalized = normalizeHiddenFungibleIds(hiddenFungibleIds);
  return normalized.length ? { ...rest, hiddenFungibleIds: normalized } : rest;
}

/** GET routes carry the list as repeated query keys, never a joined value. */
export function appendHiddenFungibleIds(
  searchParams: URLSearchParams,
  ids: readonly string[] | null | undefined,
) {
  for (const id of normalizeHiddenFungibleIds(ids)) {
    searchParams.append('hiddenFungibleIds', id);
  }
  return searchParams;
}
