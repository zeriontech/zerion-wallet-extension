import { HIDDEN_FUNGIBLE_IDS_LIMIT } from 'src/modules/zerion-api/shared/hiddenFungibleIds';

export { normalizeHiddenFungibleIds } from 'src/modules/zerion-api/shared/hiddenFungibleIds';

/**
 * Hides an id by appending it to the ordered list. Returns the same array when
 * the id is empty or already hidden, and `null` when the 500-id cap is full.
 * The cap is a write gate: stored over-limit lists are still sent in full.
 */
export function addHiddenFungibleId(
  ids: readonly string[],
  id: string
): string[] | null {
  if (!id || ids.includes(id)) {
    return ids.slice();
  }
  if (ids.length >= HIDDEN_FUNGIBLE_IDS_LIMIT) {
    return null;
  }
  return [...ids, id];
}

/** Removes an id from the ordered list; a missing id is a no-op. */
export function removeHiddenFungibleId(
  ids: readonly string[],
  id: string
): string[] {
  return ids.filter((hiddenId) => hiddenId !== id);
}

export function canHideMoreFungibles(ids: readonly string[]) {
  return ids.length < HIDDEN_FUNGIBLE_IDS_LIMIT;
}
