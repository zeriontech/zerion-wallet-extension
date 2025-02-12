import { normalizeAddress } from 'src/shared/normalizeAddress';
import type { Upgrades } from 'src/shared/type-utils/versions';
import type {
  WalletRecord,
  WalletRecordVersion1,
  WalletRecordVersion2,
  WalletRecordVersion3,
  WalletRecordVersion4,
  WalletRecordVersion5,
} from './types';

type PossibleEntry =
  | WalletRecordVersion1
  | WalletRecordVersion2
  | WalletRecordVersion3
  | WalletRecordVersion4
  | WalletRecordVersion5
  | WalletRecord;

function mapObject<V, NewValue>(
  object: Record<string, V>,
  callbackFn: (params: [string, V]) => [string, NewValue]
) {
  return Object.fromEntries(Object.entries<V>(object).map(callbackFn));
}

/**
 * Term "upgrade" taken from dexie:
 * https://dexie.org/docs/Dexie/Dexie.version()
 * https://dexie.org/docs/Version/Version.upgrade()
 */
export const walletRecordUpgrades: Upgrades<PossibleEntry> = {
  2: (entry) => {
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
  3: (entry) => {
    return {
      version: 3,
      transactions: entry.transactions,
      walletManager: entry.walletManager,
      permissions: entry.permissions,
      publicPreferences: entry.preferences,
    };
  },
  4: (entry) => {
    return {
      ...entry,
      version: 4,
      feed: {
        completedAbilities: [],
        dismissedAbilities: [],
      },
    };
  },
  5: (entry) => {
    return {
      ...entry,
      version: 5,
      permissions: mapObject(entry.permissions, ([key, value]) => {
        const addresses = value.addresses.map((address) =>
          normalizeAddress(address)
        );
        return [key, { ...value, addresses }];
      }),
    };
  },
  6: (entry) => {
    return { ...entry, version: 6, activityRecord: {} };
  },
};
