import type {
  WalletRecord,
  WalletRecordVersion1,
  WalletRecordVersion2,
  WalletRecordVersion3,
} from './types';

type PossibleEntry =
  | WalletRecordVersion1
  | WalletRecordVersion2
  | WalletRecordVersion3
  | WalletRecord;

function mapObject<V, NewValue>(
  object: Record<string, V>,
  callbackFn: (params: [string, V]) => [string, NewValue]
) {
  return Object.fromEntries(Object.entries<V>(object).map(callbackFn));
}

function assertVersion<T extends PossibleEntry>(
  entry: PossibleEntry,
  version: number
): asserts entry is T {
  if (entry.version !== version) {
    throw new Error(
      `Unexpected version provided. Expected: ${version}, received: ${entry.version}`
    );
  }
}

/**
 * Term "upgrade" taken from dexie:
 * https://dexie.org/docs/Dexie/Dexie.version()
 * https://dexie.org/docs/Version/Version.upgrade()
 */
const upgrades: Record<string, (entry: PossibleEntry) => PossibleEntry> = {
  2: (entry: PossibleEntry): WalletRecordVersion2 => {
    assertVersion<WalletRecordVersion1>(entry, 1);
    return {
      ...entry,
      version: 2,
      preferences: {}, // reset preferences because shape is changed in version: 2
      permissions: mapObject(entry.permissions, ([key, value]) => [
        key,
        { addresses: typeof value === 'string' ? [value] : value },
      ]),
    };
  },
  3: (entry: PossibleEntry): WalletRecordVersion3 => {
    assertVersion<WalletRecordVersion2>(entry, 2);
    return {
      version: 3,
      transactions: entry.transactions,
      walletManager: entry.walletManager,
      permissions: entry.permissions,
      publicPreferences: entry.preferences,
    };
  },
  4: (entry: PossibleEntry): WalletRecord => {
    assertVersion<WalletRecordVersion3>(entry, 3);
    return {
      ...entry,
      version: 4,
      feed: {
        lastSeenAbilityId: null,
        completedAbilities: [],
        dissmissedAbilities: [],
      },
    };
  },
};

const getNextVersion = (entry: PossibleEntry) => entry.version + 1;

export function upgrade(entry: PossibleEntry): WalletRecord {
  let result = entry;
  let nextVersion = getNextVersion(result);
  while (nextVersion in upgrades) {
    result = upgrades[nextVersion](result);
    nextVersion = getNextVersion(result);
  }
  return result as WalletRecord;
}
