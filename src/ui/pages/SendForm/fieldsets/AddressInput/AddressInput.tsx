import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { isTruthy } from 'is-truthy-ts';
import { useCombobox } from 'downshift';
import { queryClient } from 'src/ui/shared/requests/queryClient';
import { persistentQuery } from 'src/ui/shared/requests/queryClientPersistence';
import { FormFieldset } from 'src/ui/ui-kit/FormFieldset';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import PersonIcon from 'jsx:src/ui/assets/person.svg';
import { UIText } from 'src/ui/ui-kit/UIText';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';
import { normalizedContains } from 'normalized-contains';
import { lookupAddressNames, resolveDomain } from 'src/modules/name-service';
import { SurfaceItemButton, SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { walletPort } from 'src/ui/shared/channels';
import { UnstyledInput } from 'src/ui/ui-kit/UnstyledInput';
import { isEthereumAddress } from 'src/shared/isEthereumAddress';
import { PortfolioValue } from 'src/ui/shared/requests/PortfolioValue';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { formatCurrencyToParts } from 'src/shared/units/formatCurrencyValue';
import { NBSP } from 'src/ui/shared/typography';
import { DelayedRender } from 'src/ui/components/DelayedRender';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { usePreferences } from 'src/ui/features/preferences/usePreferences';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { getWalletDisplayName } from 'src/ui/shared/getWalletDisplayName';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { WalletSourceIcon } from 'src/ui/components/WalletSourceIcon';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';
import type { PopoverToastHandle } from 'src/ui/pages/Settings/PopoverToast';
import { PopoverToast } from 'src/ui/pages/Settings/PopoverToast';

type Item = {
  name: string | null;
  groupId: string | null;
  address: string;
  groupType: 'saved' | 'recent';
};

function matches(query: string | null, item: Item, domainInfo?: string[]) {
  if (!query) {
    return true;
  }
  const value = query.toLowerCase();
  return (
    normalizedContains(normalizeAddress(item.address), query) || // Solana address is not transformed to lowercase
    normalizedContains(normalizeAddress(item.address), value) ||
    normalizedContains(
      truncateAddress(normalizeAddress(item.address), 4),
      value
    ) ||
    (item.name && normalizedContains(item.name.toLowerCase(), value)) ||
    (domainInfo &&
      domainInfo.some((domain) =>
        normalizedContains(domain.toLowerCase(), value)
      ))
  );
}

function queryClientLookupAddressNames(address: string) {
  return queryClient.fetchQuery({
    queryKey: persistentQuery(['name-service/lookupAddressNames', address]),
    queryFn: () => lookupAddressNames(address),
    staleTime: 60000,
  });
}

function useDomainNames(items: Item[]): Record<string, string[]> {
  const [result, setResult] = useState<Record<string, string[]>>({});
  useEffect(() => {
    let mounted = true;
    items.forEach((item) => {
      const address = item.address;
      queryClientLookupAddressNames(address).then((domains) => {
        if (domains.length && mounted) {
          setResult((current) => ({ ...current, [address]: domains }));
        }
      });
    });
    return () => {
      mounted = false;
    };
  }, [items]);
  return result;
}

const SuggestedItem = React.forwardRef(
  (
    {
      item,
      index,
      value,
      domainNames,
      getTitle,
      highlighted,
      visible,
      ...props // downshift props
    }: {
      item: Item;
      index: number;
      domainNames?: string[];
      value: string | null;
      getTitle(item: Item): string;
      highlighted: boolean;
      visible: boolean;
    },
    ref: React.Ref<HTMLButtonElement>
  ) => {
    const { currency } = useCurrency();
    const title = getTitle(item);
    const matchingTitle = useMemo(() => {
      return (
        value &&
        domainNames?.find((domain) =>
          normalizedContains(domain.toLowerCase(), value.toLowerCase())
        )
      );
    }, [value, domainNames]);

    const showMatchingTitle = Boolean(matchingTitle) && matchingTitle !== title;

    return (
      <SurfaceItemButton
        type="button"
        highlighted={highlighted}
        decorationStyle={{ padding: 12 }}
        ref={ref}
        tabIndex={-1}
        {...props}
      >
        <HStack
          gap={24}
          alignItems="center"
          style={{
            gridTemplateColumns: '1fr auto',
            width: '100%',
          }}
        >
          <HStack
            gap={12}
            alignItems="center"
            style={{
              gridTemplateColumns: 'auto 1fr',
            }}
          >
            <WalletAvatar
              address={item.address}
              size={22}
              borderRadius={6}
              icon={
                <WalletSourceIcon
                  address={item.address}
                  groupId={item.groupId}
                  style={{ width: 10, height: 10 }}
                />
              }
            />
            <UIText
              kind="body/regular"
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {showMatchingTitle && highlighted ? matchingTitle : title}
            </UIText>
          </HStack>
          <PortfolioValue
            address={item.address}
            enabled={visible}
            render={(query) => (
              <UIText kind="body/accent">
                {query.data ? (
                  <NeutralDecimals
                    parts={formatCurrencyToParts(
                      query.data.data?.totalValue || 0,
                      'en',
                      currency
                    )}
                  />
                ) : (
                  NBSP
                )}
              </UIText>
            )}
          />
        </HStack>
      </SurfaceItemButton>
    );
  }
);

function SectionTitle({
  style,
  ...props
}: Omit<React.HTMLProps<HTMLDivElement>, 'kind' | 'as' | 'ref'>) {
  return (
    <UIText
      kind="caption/accent"
      color="var(--neutral-500)"
      style={{
        paddingBottom: 4,
        paddingTop: 8,
        ...style,
      }}
      {...props}
    />
  );
}

export function AddressInput({
  title,
  endTitle,
  value,
  autoFocus,
  resolvedAddress,
  onChange,
  onResolvedChange,
  items: allItems,
  fieldsetStyle,
  iconSize,
  borderRadius = 6,
  ...inputProps
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'title' | 'onChange'> & {
  title: React.ReactNode;
  endTitle?: React.ReactNode;
  value: string;
  autoFocus?: boolean;
  resolvedAddress: string | null;
  onChange(value: string): void;
  onResolvedChange(value: string | null): void;
  items: Item[];
  fieldsetStyle?: React.CSSProperties;
  iconSize: number;
  borderRadius?: number;
}) {
  const onResolvedChangeRef = useRef(onResolvedChange);
  onResolvedChangeRef.current = onResolvedChange;

  const menuRef = useRef<HTMLElement | null>(null);
  const domainNames = useDomainNames(allItems);
  const [showAllItems, setShowAllItems] = useState(true);

  const items = useMemo(() => {
    return allItems.filter(
      (item) => showAllItems || matches(value, item, domainNames[item.address])
    );
  }, [allItems, value, domainNames, showAllItems]);

  const normalizedValue = normalizeAddress(value.trim());
  const { data: resolvedValue, isLoading } = useQuery({
    queryKey: ['resolveAddressInput', normalizedValue, domainNames],
    queryFn: () => {
      if (!normalizedValue) {
        return null;
      }
      if (isEthereumAddress(normalizedValue)) {
        return normalizedValue;
      }
      const existingAddress = allItems.find(
        (item) =>
          item.name?.toLowerCase() === normalizedValue.toLowerCase() ||
          truncateAddress(normalizeAddress(item.address), 4) === normalizedValue
      )?.address;
      if (existingAddress) {
        return existingAddress;
      }
      const preresolvedAddress = Object.keys(domainNames).find((address) =>
        domainNames[address].includes(normalizedValue)
      );
      if (preresolvedAddress) {
        return preresolvedAddress;
      }
      return resolveDomain(normalizedValue || '');
    },
    suspense: false,
  });

  useEffect(() => {
    onResolvedChangeRef.current(resolvedValue || null);
  }, [resolvedValue]);

  const getTitle = useCallback(
    (item: Item) => {
      return item.name
        ? getWalletDisplayName(item)
        : domainNames[item.address]?.[0] || getWalletDisplayName(item);
    },
    [domainNames]
  );

  const {
    isOpen,
    highlightedIndex,
    getToggleButtonProps,
    getItemProps,
    getMenuProps,
    getInputProps,
    closeMenu,
  } = useCombobox<Item | null>({
    items,
    inputValue: value || '',
    getItemId: (index) =>
      items[index] ? `${items[index]?.groupType}-${items[index]?.address}` : '',
    itemToString: (item) => (item ? getTitle(item) : ''),
    onSelectedItemChange: ({ selectedItem }) => {
      if (!selectedItem) {
        return;
      }
      onChange(getTitle(selectedItem));
      closeMenu();
    },
    onIsOpenChange: ({ isOpen }) => {
      if (isOpen) {
        if (items.length === 0 || resolvedValue) {
          setShowAllItems(true);
        }
      }
    },
  });

  const recentAddressesLength = useMemo(() => {
    return items.filter((item) => item.groupType === 'recent').length;
  }, [items]);
  const showLabels =
    recentAddressesLength !== 0 && recentAddressesLength !== items.length;
  const showMenu = Boolean(isOpen && items.length);

  const toastRef = useRef<PopoverToastHandle>(null);
  const { handleCopy } = useCopyToClipboard({
    text: resolvedAddress ?? '',
    onSuccess: () => toastRef.current?.showToast(),
  });

  return (
    <>
      <PopoverToast
        ref={toastRef}
        style={{
          bottom: 'calc(100px + var(--technical-panel-bottom-height, 0px))',
        }}
      >
        Address copied to clipboard
      </PopoverToast>
      <div style={{ position: 'relative' }}>
        <FormFieldset
          style={fieldsetStyle}
          title={title}
          endTitle={endTitle}
          startInput={
            <HStack
              gap={8}
              alignItems="center"
              style={{ gridTemplateColumns: 'auto 1fr' }}
            >
              <UnstyledButton {...getToggleButtonProps({ type: 'button' })}>
                {resolvedAddress ? (
                  <WalletAvatar
                    address={resolvedAddress}
                    size={iconSize}
                    borderRadius={borderRadius}
                  />
                ) : (
                  <div
                    style={{
                      width: iconSize,
                      height: iconSize,
                      borderRadius,
                      backgroundColor: 'var(--neutral-400)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isLoading ? (
                      <DelayedRender delay={200}>
                        <CircleSpinner />
                      </DelayedRender>
                    ) : null}
                  </div>
                )}
              </UnstyledButton>
              <UIText kind="headline/h3">
                <UnstyledInput
                  {...getInputProps({
                    ...inputProps,
                    // use onChange instead of onInputValueChange for controlled inputs
                    // https://github.com/downshift-js/downshift/issues/1108#issuecomment-674180157
                    onChange: (e) => {
                      setShowAllItems(false);
                      onChange(e.currentTarget.value ?? '');
                    },
                    autoFocus,
                    placeholder: 'Address, domain or identity',
                    style: { width: '100%' },
                  })}
                />
              </UIText>
            </HStack>
          }
          endInput={
            <UnstyledButton
              {...getToggleButtonProps({
                type: 'button',
                style: { display: 'flex' },
              })}
            >
              <PersonIcon
                style={{ width: 24, height: 24, color: 'var(--neutral-500)' }}
              />
            </UnstyledButton>
          }
          startDescription={
            <UnstyledButton
              type="button"
              disabled={!resolvedAddress}
              onDoubleClick={handleCopy}
              style={{ width: '100%' }}
            >
              {resolvedAddress ? (
                <HStack
                  gap={0}
                  justifyContent="start"
                  style={{
                    gridTemplateColumns: 'auto minmax(min-content, 1fr)',
                  }}
                >
                  <UIText
                    kind="caption/regular"
                    color="var(--neutral-500)"
                    title={resolvedAddress ?? undefined}
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {resolvedAddress.slice(0, -6)}
                  </UIText>
                  <UIText
                    kind="caption/regular"
                    color="var(--neutral-500)"
                    title={resolvedAddress ?? undefined}
                  >
                    {resolvedAddress.slice(-6)}
                  </UIText>
                </HStack>
              ) : (
                <UIText
                  kind="caption/regular"
                  color="var(--neutral-500)"
                  title={resolvedAddress ?? undefined}
                >
                  0x0000...
                </UIText>
              )}
            </UnstyledButton>
          }
        />
        <SurfaceList
          style={{
            visibility: showMenu ? 'visible' : 'hidden',
            position: 'absolute',
            zIndex: 'var(--max-layout-index)',
            padding: 0,
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: 'var(--z-index-1)',
            boxShadow: 'var(--elevation-200)',
            maxHeight: '50vh',
            overflow: 'auto',
            paddingBlock: 8,
            ['--column-padding-inline' as string]: 0,
          }}
          {...getMenuProps({ ref: menuRef })}
          items={[
            showLabels
              ? {
                  key: 'recent',
                  pad: false,
                  component: (
                    <SectionTitle style={{ paddingTop: 0 }}>
                      Recents
                    </SectionTitle>
                  ),
                }
              : null,
            ...items.slice(0, recentAddressesLength).map((item, index) => {
              return {
                key: `recent-${item.address}-${item.groupId}`,
                style: { padding: 0 },
                pad: false,
                component: (
                  <SuggestedItem
                    {...getItemProps({
                      item,
                      index,
                      style: { paddingInline: 8 },
                    })}
                    value={value}
                    item={item}
                    index={index}
                    highlighted={highlightedIndex === index}
                    visible={showMenu}
                    domainNames={domainNames[item.address]}
                    getTitle={getTitle}
                  />
                ),
              };
            }),
            showLabels
              ? {
                  key: 'saved',
                  pad: false,
                  component: <SectionTitle>Your wallets</SectionTitle>,
                }
              : null,
            ...items.slice(recentAddressesLength).map((item, internalIndex) => {
              const index = internalIndex + recentAddressesLength;
              return {
                key: `saved-${item.address}-${item.groupId}`,
                style: { padding: 0 },
                pad: false,
                component: (
                  <SuggestedItem
                    {...getItemProps({
                      item,
                      index,
                      style: { paddingInline: 8 },
                    })}
                    value={value}
                    item={item}
                    index={index}
                    highlighted={highlightedIndex === index}
                    visible={showMenu}
                    domainNames={domainNames[item.address]}
                    getTitle={getTitle}
                  />
                ),
              };
            }),
          ].filter(isTruthy)}
        />
      </div>
    </>
  );
}

export function AddressInputWrapper({
  filterAddressPredicate,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'title' | 'onChange'> & {
  fieldsetStyle?: React.CSSProperties;
  title: React.ReactNode;
  endTitle?: React.ReactNode;
  autoFocus?: boolean;
  value: string;
  resolvedAddress: string | null;
  onChange(value: string): void;
  onResolvedChange(value: string | null): void;
  filterAddressPredicate?: (address: string) => boolean;
  iconSize: number;
  borderRadius?: number;
}) {
  const { data: walletGroups, isLoading } = useQuery({
    queryKey: ['wallet/uiGetWalletGroups'],
    queryFn: () => walletPort.request('uiGetWalletGroups'),
    useErrorBoundary: true,
    suspense: false,
  });

  const { savedNamesMap, savedWallets } = useMemo(() => {
    const wallets: Item[] = [];
    const namesMap: Record<string, string> = {};
    if (walletGroups) {
      for (const group of walletGroups) {
        for (const wallet of group.walletContainer.wallets) {
          const address = normalizeAddress(wallet.address);
          wallets.push({
            address,
            groupId: group.id,
            name: wallet.name || null,
            groupType: 'saved',
          });
          if (wallet.name) {
            namesMap[address] = wallet.name;
          }
        }
      }
    }
    return { savedWallets: [...wallets], savedNamesMap: namesMap };
  }, [walletGroups]);

  const { preferences } = usePreferences();

  const recentWallets = useMemo<Item[]>(() => {
    return (
      preferences?.recentAddresses.map((address) => {
        return {
          address,
          groupId: null,
          name: savedNamesMap[address] || null,
          groupType: 'recent',
        };
      }) || []
    );
  }, [preferences?.recentAddresses, savedNamesMap]);

  const addresses = useMemo(() => {
    return [...recentWallets, ...savedWallets].filter(
      (wallet) => filterAddressPredicate?.(wallet.address) ?? true
    );
  }, [savedWallets, recentWallets, filterAddressPredicate]);

  if (isLoading) {
    return (
      <FormFieldset
        style={props.fieldsetStyle}
        title={props.title}
        endTitle={props.endTitle}
        startInput={
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              backgroundColor: 'var(--neutral-400)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <DelayedRender delay={200}>
              <CircleSpinner />
            </DelayedRender>
          </div>
        }
        startDescription={
          <UIText kind="caption/regular" color="var(--neutral-500)">
            0x0000...
          </UIText>
        }
      />
    );
  }

  return <AddressInput {...props} items={addresses} />;
}
