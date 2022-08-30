import type { WalletRecord, WalletRecordVersion0 } from './types';

type PossibleEntry = WalletRecordVersion0 | WalletRecord;

/**
 * Term "upgrade" taken from dexie:
 * https://dexie.org/docs/Dexie/Dexie.version()
 * https://dexie.org/docs/Version/Version.upgrade()
 */
const upgrades: Record<string, (entry: PossibleEntry) => PossibleEntry> = {
  1: (entry: WalletRecordVersion0): WalletRecord => {
    return {
      ...entry,
      version: 1,
      preferences: {},
    };
  },
};

const getNextVersion = (entry: Partial<WalletRecord>) =>
  (entry.version ?? 0) + 1;

export function upgrade(entry: PossibleEntry): WalletRecord {
  let result = entry;
  let nextVersion = getNextVersion(result);
  while (nextVersion in upgrades) {
    result = upgrades[nextVersion](result);
    nextVersion = getNextVersion(result);
  }
  return result as WalletRecord;
}
