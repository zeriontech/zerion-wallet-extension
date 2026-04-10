import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Combobox,
  ComboboxItem,
  ComboboxPopover,
  ComboboxProvider,
  ComboboxGroup,
  ComboboxGroupLabel,
} from '@ariakit/react/combobox';
import { normalizedContains } from 'normalized-contains';
import { isEthereumAddress } from 'src/shared/isEthereumAddress';
import { isSolanaAddress } from 'src/modules/solana/shared';
import { resolveDomain } from 'src/modules/name-service';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { getWalletDisplayName } from 'src/ui/shared/getWalletDisplayName';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { UIText } from 'src/ui/ui-kit/UIText';
import { HStack } from 'src/ui/ui-kit/HStack';
import type { AddressItem } from './useReceiverAddressItems';
import * as styles from './AddressCombobox.module.css';

function matches(query: string | null, item: AddressItem) {
  if (!query) {
    return true;
  }
  const value = query.toLowerCase();
  return (
    normalizedContains(normalizeAddress(item.address).toLowerCase(), value) ||
    normalizedContains(
      truncateAddress(normalizeAddress(item.address), 4),
      value
    ) ||
    (item.name != null && normalizedContains(item.name.toLowerCase(), value))
  );
}

function getTitle(item: AddressItem) {
  return getWalletDisplayName(item);
}

export function AddressCombobox({
  items,
  value,
  onChange,
  onResolvedChange,
}: {
  items: AddressItem[];
  value: string;
  onChange: (value: string) => void;
  onResolvedChange: (value: string | null) => void;
}) {
  const [open, setOpen] = useState(true);

  const filteredItems = useMemo(() => {
    return items.filter((item) => matches(value, item));
  }, [items, value]);

  const recentItems = useMemo(
    () => filteredItems.filter((item) => item.groupType === 'recent'),
    [filteredItems]
  );
  const savedItems = useMemo(
    () => filteredItems.filter((item) => item.groupType === 'saved'),
    [filteredItems]
  );
  const showLabels = recentItems.length > 0 && savedItems.length > 0;

  const normalizedValue = normalizeAddress(value.trim());
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
      const existingAddress = items.find(
        (item) =>
          item.name?.toLowerCase() === normalizedValue.toLowerCase() ||
          truncateAddress(normalizeAddress(item.address), 4) === normalizedValue
      )?.address;
      if (existingAddress) {
        return existingAddress;
      }
      return resolveDomain(normalizedValue || '');
    },
    suspense: false,
  });

  const onResolvedChangeRef = useRef(onResolvedChange);
  onResolvedChangeRef.current = onResolvedChange;

  useEffect(() => {
    onResolvedChangeRef.current(resolvedValue || null);
  }, [resolvedValue]);

  const handleSelect = useCallback(
    (item: AddressItem) => {
      onChange(getTitle(item));
      setOpen(false);
    },
    [onChange]
  );

  return (
    <div style={{ position: 'relative' }}>
      <ComboboxProvider
        open={open}
        setOpen={setOpen}
        setValue={(newValue) => {
          onChange(newValue);
          setOpen(true);
        }}
        value={value}
      >
        <UIText kind="headline/h3">
          <Combobox
            className={styles.input}
            placeholder="Address, domain or identity"
            autoFocus={true}
            autoSelect={true}
          />
        </UIText>
        {filteredItems.length > 0 ? (
          <ComboboxPopover className={styles.popover} sameWidth={true}>
            {recentItems.length > 0 ? (
              <ComboboxGroup>
                {showLabels ? (
                  <ComboboxGroupLabel>
                    <UIText
                      kind="caption/accent"
                      color="var(--neutral-500)"
                      className={styles.sectionTitle}
                    >
                      Recents
                    </UIText>
                  </ComboboxGroupLabel>
                ) : null}
                {recentItems.map((item) => (
                  <ComboboxItem
                    key={`recent-${item.address}`}
                    className={styles.item}
                    value={getTitle(item)}
                    onClick={() => handleSelect(item)}
                  >
                    <WalletAvatar
                      address={item.address}
                      size={24}
                      borderRadius={6}
                    />
                    <UIText
                      kind="body/regular"
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {getTitle(item)}
                    </UIText>
                  </ComboboxItem>
                ))}
              </ComboboxGroup>
            ) : null}
            {savedItems.length > 0 ? (
              <ComboboxGroup>
                {showLabels ? (
                  <ComboboxGroupLabel>
                    <UIText
                      kind="caption/accent"
                      color="var(--neutral-500)"
                      className={styles.sectionTitle}
                    >
                      Your wallets
                    </UIText>
                  </ComboboxGroupLabel>
                ) : null}
                {savedItems.map((item) => (
                  <ComboboxItem
                    key={`saved-${item.address}-${item.groupId}`}
                    className={styles.item}
                    value={getTitle(item)}
                    onClick={() => handleSelect(item)}
                  >
                    <WalletAvatar
                      address={item.address}
                      size={24}
                      borderRadius={6}
                    />
                    <HStack
                      gap={0}
                      style={{
                        gridTemplateColumns: '1fr',
                        overflow: 'hidden',
                      }}
                    >
                      <UIText
                        kind="body/regular"
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {getTitle(item)}
                      </UIText>
                    </HStack>
                  </ComboboxItem>
                ))}
              </ComboboxGroup>
            ) : null}
          </ComboboxPopover>
        ) : null}
      </ComboboxProvider>
    </div>
  );
}
