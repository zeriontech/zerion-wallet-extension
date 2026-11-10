import { HIDDEN_FUNGIBLE_IDS_LIMIT } from 'src/modules/zerion-api/shared/hiddenFungibleIds';
import {
  addHiddenFungibleId,
  canHideMoreFungibles,
  removeHiddenFungibleId,
} from './hiddenFungibleIds';

describe('hidden fungible mutators', () => {
  test('hide appends in hide order and ignores an already hidden id', () => {
    const once = addHiddenFungibleId([], 'usdc');
    expect(once).toEqual(['usdc']);
    const twice = addHiddenFungibleId(once!, 'eth');
    expect(twice).toEqual(['usdc', 'eth']);
    expect(addHiddenFungibleId(twice!, 'usdc')).toEqual(['usdc', 'eth']);
  });

  test('hide ignores an empty id', () => {
    expect(addHiddenFungibleId(['eth'], '')).toEqual(['eth']);
  });

  test('hide refuses the 501st id and keeps the stored list untouched', () => {
    const ids = Array.from({ length: HIDDEN_FUNGIBLE_IDS_LIMIT }, (_, index) => `token-${index}`);
    expect(addHiddenFungibleId(ids, 'one-more')).toBeNull();
    expect(ids).toHaveLength(HIDDEN_FUNGIBLE_IDS_LIMIT);
  });

  test('unhide removes only the requested id', () => {
    expect(removeHiddenFungibleId(['eth', 'usdc', 'dai'], 'usdc')).toEqual(['eth', 'dai']);
    expect(removeHiddenFungibleId(['eth'], 'dai')).toEqual(['eth']);
  });

  test('the cap boundary allows the 500th hide and refuses the next', () => {
    const ids = Array.from(
      { length: HIDDEN_FUNGIBLE_IDS_LIMIT - 1 },
      (_, index) => `token-${index}`,
    );
    expect(canHideMoreFungibles(ids)).toBe(true);
    const full = addHiddenFungibleId(ids, 'last-allowed');
    expect(full).toHaveLength(HIDDEN_FUNGIBLE_IDS_LIMIT);
    expect(canHideMoreFungibles(full!)).toBe(false);
  });
});
