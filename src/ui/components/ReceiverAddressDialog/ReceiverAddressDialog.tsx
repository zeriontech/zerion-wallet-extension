import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Combobox,
  ComboboxProvider,
  ComboboxItem,
} from '@ariakit/react/combobox';
import { normalizedContains } from 'normalized-contains';
import SearchIcon from 'jsx:src/ui/assets/search.svg';
import PersonIcon from 'jsx:src/ui/assets/person.svg';
import { isEthereumAddress } from 'src/shared/isEthereumAddress';
import { isSolanaAddress } from 'src/modules/solana/shared';
import { resolveDomain } from 'src/modules/name-service';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { Dialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { Input } from 'src/ui/ui-kit/Input';
import { UIText } from 'src/ui/ui-kit/UIText';
import { useWalletsMetaByChunks } from 'src/ui/shared/requests/useWalletsMetaByChunks';
import { VirtualizedTokenList } from 'src/ui/components/PositionSelector/VirtualizedTokenList';
import type { VirtualListItem } from 'src/ui/components/PositionSelector/VirtualizedTokenList';
import { AddressListItem } from './AddressListItem';
import type { AddressItem } from './useReceiverAddressItems';
import { useReceiverAddressItems } from './useReceiverAddressItems';
import * as styles from './ReceiverAddressDialog.module.css';

const SKELETON_ROW_COUNT = 6;
const RECENTS_LIMIT = 3;

function matches(
  query: string,
  item: AddressItem,
  handlesByAddress: Map<string, string[]>
) {
  if (!query) {
    return true;
  }
  const value = query.toLowerCase();
  const normalized = normalizeAddress(item.address);
  if (normalizedContains(normalized.toLowerCase(), value)) return true;
  if (normalizedContains(truncateAddress(normalized, 4), value)) return true;
  if (item.name != null && normalizedContains(item.name.toLowerCase(), value)) {
    return true;
  }
  const handles = handlesByAddress.get(normalized);
  if (handles) {
    for (const handle of handles) {
      if (normalizedContains(handle.toLowerCase(), value)) return true;
    }
  }
  return false;
}

type RowData = {
  address: string;
  name: string | null;
  pending?: boolean;
};

export function ReceiverAddressDialog({
  open,
  onClose,
  title = 'Recipient',
  predicate,
  validateMatch,
  onSelect,
  showAddressBookSection = true,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  predicate?: (address: string) => boolean;
  validateMatch?: (address: string) => string;
  onSelect: (address: string) => void;
  showAddressBookSection?: boolean;
}) {
  const [searchValue, setSearchValue] = useState('');
  const {
    recentItems,
    addressBookItems,
    walletItems,
    watchlistItems,
    isLoading,
  } = useReceiverAddressItems();

  const allAddresses = useMemo(() => {
    const set = new Set<string>();
    for (const item of recentItems) set.add(normalizeAddress(item.address));
    for (const item of addressBookItems)
      set.add(normalizeAddress(item.address));
    for (const item of walletItems) set.add(normalizeAddress(item.address));
    for (const item of watchlistItems) set.add(normalizeAddress(item.address));
    return Array.from(set);
  }, [recentItems, addressBookItems, walletItems, watchlistItems]);

  const { data: walletMetaList } = useWalletsMetaByChunks({
    addresses: allAddresses,
    enabled: allAddresses.length > 0,
    suspense: false,
    useErrorBoundary: false,
    staleTime: 1000 * 60 * 10,
  });

  const handlesByAddress = useMemo(() => {
    const map = new Map<string, string[]>();
    if (!walletMetaList) return map;
    for (const meta of walletMetaList) {
      if (!meta) continue;
      const handles = meta.identities
        ?.map((identity) => identity.handle)
        .filter((handle): handle is string => Boolean(handle));
      if (handles && handles.length > 0) {
        map.set(normalizeAddress(meta.address), handles);
      }
    }
    return map;
  }, [walletMetaList]);

  const normalizedValue = normalizeAddress(searchValue.trim());
  const { data: resolvedValue } = useQuery({
    queryKey: ['resolveReceiverAddress', normalizedValue],
    queryFn: () => {
      if (!normalizedValue) {
        return null;
      }
      if (
        isEthereumAddress(normalizedValue) ||
        isSolanaAddress(normalizedValue)
      ) {
        return normalizedValue;
      }
      return resolveDomain(normalizedValue);
    },
    suspense: false,
    enabled: Boolean(normalizedValue),
  });

  const resolvedAddress = resolvedValue ?? null;

  const { isFetching: isExactMatchMetaFetching } = useWalletsMetaByChunks({
    addresses: resolvedAddress ? [resolvedAddress] : [],
    enabled: Boolean(resolvedAddress),
    suspense: false,
    useErrorBoundary: false,
    staleTime: 1000 * 60 * 10,
  });

  const filteredRecents = useMemo(
    () =>
      recentItems
        .filter(
          (item) =>
            (predicate?.(item.address) ?? true) &&
            matches(searchValue, item, handlesByAddress)
        )
        .slice(0, RECENTS_LIMIT),
    [recentItems, predicate, searchValue, handlesByAddress]
  );
  const filteredAddressBook = useMemo(
    () =>
      showAddressBookSection
        ? addressBookItems.filter(
            (item) =>
              (predicate?.(item.address) ?? true) &&
              matches(searchValue, item, handlesByAddress)
          )
        : [],
    [
      showAddressBookSection,
      addressBookItems,
      predicate,
      searchValue,
      handlesByAddress,
    ]
  );
  const filteredWallets = useMemo(
    () =>
      walletItems.filter(
        (item) =>
          (predicate?.(item.address) ?? true) &&
          matches(searchValue, item, handlesByAddress)
      ),
    [walletItems, predicate, searchValue, handlesByAddress]
  );
  const filteredWatchlist = useMemo(
    () =>
      watchlistItems.filter(
        (item) =>
          (predicate?.(item.address) ?? true) &&
          matches(searchValue, item, handlesByAddress)
      ),
    [watchlistItems, predicate, searchValue, handlesByAddress]
  );

  const exactMatch = useMemo<RowData | null>(() => {
    if (!resolvedAddress) return null;
    const normalized = normalizeAddress(resolvedAddress);
    if (predicate && !predicate(normalized)) return null;
    return {
      address: normalized,
      name: null,
      pending: isExactMatchMetaFetching,
    };
  }, [resolvedAddress, predicate, isExactMatchMetaFetching]);

  const exactMatchAddress = exactMatch?.address ?? null;
  const dedupedRecents = useMemo(
    () =>
      exactMatchAddress
        ? filteredRecents.filter(
            (item) => normalizeAddress(item.address) !== exactMatchAddress
          )
        : filteredRecents,
    [filteredRecents, exactMatchAddress]
  );
  const dedupedAddressBook = useMemo(
    () =>
      exactMatchAddress
        ? filteredAddressBook.filter(
            (item) => normalizeAddress(item.address) !== exactMatchAddress
          )
        : filteredAddressBook,
    [filteredAddressBook, exactMatchAddress]
  );
  const dedupedWallets = useMemo(
    () =>
      exactMatchAddress
        ? filteredWallets.filter(
            (item) => normalizeAddress(item.address) !== exactMatchAddress
          )
        : filteredWallets,
    [filteredWallets, exactMatchAddress]
  );
  const dedupedWatchlist = useMemo(
    () =>
      exactMatchAddress
        ? filteredWatchlist.filter(
            (item) => normalizeAddress(item.address) !== exactMatchAddress
          )
        : filteredWatchlist,
    [filteredWatchlist, exactMatchAddress]
  );

  const errorMessage = useMemo(() => {
    if (!validateMatch || !resolvedAddress) return '';
    return validateMatch(normalizeAddress(resolvedAddress));
  }, [validateMatch, resolvedAddress]);

  const virtualItems = useMemo<VirtualListItem<RowData>[]>(() => {
    const list: VirtualListItem<RowData>[] = [];
    type Section = {
      label: string;
      rows: RowData[];
      icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    };
    const sections: Section[] = [];
    if (exactMatch) {
      sections.push({ label: 'Exact match', rows: [exactMatch] });
    }
    if (dedupedRecents.length > 0) {
      sections.push({
        label: 'Recents',
        rows: dedupedRecents.map((item) => ({
          address: item.address,
          name: item.name,
        })),
      });
    }
    if (dedupedAddressBook.length > 0) {
      sections.push({
        label: 'Address Book',
        icon: PersonIcon,
        rows: dedupedAddressBook.map((item) => ({
          address: item.address,
          name: item.name,
        })),
      });
    }
    if (dedupedWallets.length > 0) {
      sections.push({
        label: 'My wallets',
        rows: dedupedWallets.map((item) => ({
          address: item.address,
          name: item.name,
        })),
      });
    }
    if (dedupedWatchlist.length > 0) {
      sections.push({
        label: 'Watchlist',
        rows: dedupedWatchlist.map((item) => ({
          address: item.address,
          name: item.name,
        })),
      });
    }
    for (const section of sections) {
      list.push({
        kind: 'header',
        key: `header-${section.label}`,
        label: section.label,
        icon: section.icon,
      });
      for (const row of section.rows) {
        list.push({
          kind: 'item',
          key: `${section.label}-${row.address}`,
          data: row,
        });
      }
    }
    return list;
  }, [
    exactMatch,
    dedupedRecents,
    dedupedAddressBook,
    dedupedWallets,
    dedupedWatchlist,
  ]);

  const handlePick = (address: string) => {
    onSelect(address);
    onClose();
  };

  const isEmpty = virtualItems.length === 0;
  const hasAnyItems =
    recentItems.length > 0 ||
    walletItems.length > 0 ||
    watchlistItems.length > 0;

  return (
    <Dialog2
      open={open}
      onClose={() => {
        setSearchValue('');
        onClose();
      }}
      title={title}
    >
      <ComboboxProvider
        open={true}
        focusLoop={false}
        focusShift
        focusWrap="horizontal"
        resetValueOnHide
        setValue={setSearchValue}
      >
        <div className={styles.searchWrapper}>
          <div className={styles.searchInputWrapper}>
            <SearchIcon role="presentation" className={styles.searchIcon} />
            <Combobox
              autoSelect="always"
              placeholder="Address, domain or identity"
              render={<Input style={{ paddingLeft: 40 }} />}
            />
          </div>
          {errorMessage ? (
            <UIText
              kind="caption/regular"
              color="var(--negative-500)"
              className={styles.errorCaption}
            >
              {errorMessage}
            </UIText>
          ) : null}
        </div>
        <div className={styles.scrollArea}>
          {isLoading ? (
            <div>
              {Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
                <div key={index} className={styles.skeletonRow}>
                  <div className={styles.skeletonAvatar} />
                  <div className={styles.skeletonInfo}>
                    <div className={styles.skeletonLineLg} />
                    <div className={styles.skeletonLineSm} />
                  </div>
                </div>
              ))}
            </div>
          ) : isEmpty ? (
            <div className={styles.emptyState}>
              <UIText kind="body/regular" color="var(--neutral-500)">
                {hasAnyItems
                  ? 'No results'
                  : 'Search for an address, domain or identity to send to'}
              </UIText>
            </div>
          ) : (
            <>
              <VirtualizedTokenList
                items={virtualItems}
                rowHeight={64}
                renderHeader={(label, Icon) => (
                  <div className={styles.sectionHeader}>
                    <UIText
                      kind="caption/accent"
                      color="var(--neutral-500)"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {Icon ? (
                        <Icon
                          style={{
                            width: 16,
                            height: 16,
                            color: 'var(--neutral-500)',
                          }}
                        />
                      ) : null}
                      {label}
                    </UIText>
                  </div>
                )}
                renderItem={(row) =>
                  row.pending ? (
                    <div className={styles.row}>
                      <div className={styles.rowInner}>
                        <div className={styles.skeletonAvatar} />
                        <div className={styles.skeletonInfo}>
                          <div className={styles.skeletonLineLg} />
                          <div className={styles.skeletonLineSm} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <ComboboxItem
                      className={styles.row}
                      value={row.address}
                      onClick={() => handlePick(row.address)}
                    >
                      <div className={styles.rowInner}>
                        <AddressListItem
                          address={row.address}
                          localName={row.name}
                        />
                      </div>
                    </ComboboxItem>
                  )
                }
              />
              <div style={{ height: 40, flexShrink: 0 }} />
            </>
          )}
        </div>
      </ComboboxProvider>
    </Dialog2>
  );
}
