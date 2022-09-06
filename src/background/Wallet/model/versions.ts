import type {
  WalletRecord,
  WalletRecordVersion0,
  WalletRecordVersion1,
} from './types';

type PossibleEntry = WalletRecordVersion0 | WalletRecord;

function mapObject<V, NewValue>(
  object: Record<string, V>,
  callbackFn: (params: [string, V]) => [string, NewValue]
) {
  return Object.fromEntries(Object.entries<V>(object).map(callbackFn));
}

function isWalletVersion0(entry: PossibleEntry): entry is WalletRecordVersion0 {
  return 'version' in entry === false;
}

/**
 * Term "upgrade" taken from dexie:
 * https://dexie.org/docs/Dexie/Dexie.version()
 * https://dexie.org/docs/Version/Version.upgrade()
 */
const upgrades: Record<string, (entry: PossibleEntry) => PossibleEntry> = {
  1: (entry: PossibleEntry): WalletRecordVersion1 => {
    if (!isWalletVersion0(entry)) {
      throw new Error('Wrong entry version');
    }
    return {
      ...entry,
      version: 1,
      preferences: {},
    };
  },
  2: (entry: PossibleEntry): WalletRecord => {
    function isWalletVersion1(
      entry: PossibleEntry
    ): entry is WalletRecordVersion1 {
      // @ts-ignore
      return entry?.version === 1;
    }
    if (!isWalletVersion1(entry)) {
      throw new Error('Wrong entry version');
    }
    return {
      ...entry,
      version: 2,
      preferences: {},
      permissions: mapObject(entry.permissions, ([key, value]) => [
        key,
        { addresses: typeof value === 'string' ? [value] : value },
      ]),
    };
  },
};

const getNextVersion = (entry: PossibleEntry) =>
  (isWalletVersion0(entry) ? 0 : entry.version) + 1;

export function upgrade(entry: PossibleEntry): WalletRecord {
  let result = entry;
  let nextVersion = getNextVersion(result);
  while (nextVersion in upgrades) {
    result = upgrades[nextVersion](result);
    nextVersion = getNextVersion(result);
  }
  return result as WalletRecord;
}
