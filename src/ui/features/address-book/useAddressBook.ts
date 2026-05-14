import { useCallback, useMemo } from 'react';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import type { AddressBookEntry } from 'src/background/Wallet/model/types';
import { usePreferences } from 'src/ui/features/preferences';

function normalizeEntry(entry: AddressBookEntry): AddressBookEntry {
  return {
    address: normalizeAddress(entry.address),
    name: entry.name?.trim() || undefined,
  };
}

export function useAddressBook() {
  const { preferences, setPreferences } = usePreferences();
  const entries = useMemo(
    () => preferences?.addressBook ?? [],
    [preferences?.addressBook]
  );

  const upsert = useCallback(
    (entry: AddressBookEntry) => {
      const normalized = normalizeEntry(entry);
      const index = entries.findIndex(
        (item) => normalizeAddress(item.address) === normalized.address
      );
      const next =
        index >= 0
          ? entries.map((item, i) => (i === index ? normalized : item))
          : [...entries, normalized];
      setPreferences({ addressBook: next });
    },
    [entries, setPreferences]
  );

  const remove = useCallback(
    (address: string) => {
      const target = normalizeAddress(address);
      setPreferences({
        addressBook: entries.filter(
          (item) => normalizeAddress(item.address) !== target
        ),
      });
    },
    [entries, setPreferences]
  );

  const reorder = useCallback(
    (next: AddressBookEntry[]) => {
      setPreferences({ addressBook: next });
    },
    [setPreferences]
  );

  const has = useCallback(
    (address: string) => {
      const target = normalizeAddress(address);
      return entries.some((item) => normalizeAddress(item.address) === target);
    },
    [entries]
  );

  const find = useCallback(
    (address: string) => {
      const target = normalizeAddress(address);
      return entries.find((item) => normalizeAddress(item.address) === target);
    },
    [entries]
  );

  return { entries, upsert, remove, reorder, has, find };
}
