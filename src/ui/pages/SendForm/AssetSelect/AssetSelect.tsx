import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import type { AddressPosition } from 'defi-sdk';
import noop from 'lodash/noop';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useCombobox } from 'downshift';
import DownIcon from 'jsx:src/ui/assets/chevron-down.svg';
import ErrorIcon from 'jsx:src/ui/assets/warning.svg';
import { baseToCommon } from 'src/shared/units/convert';
import {
  getAssetImplementationInChain,
  getDecimals,
} from 'src/modules/networks/asset';
import type { Chain } from 'src/modules/networks/Chain';
import { createChain } from 'src/modules/networks/Chain';
import { formatTokenValue } from 'src/shared/units/formatTokenValue';
import { formatCurrencyValue } from 'src/shared/units/formatCurrencyValue';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Media } from 'src/ui/ui-kit/Media';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { UIText } from 'src/ui/ui-kit/UIText';
import { normalizedContains } from 'normalized-contains';
import { useDebouncedCallback } from 'src/ui/shared/useDebouncedCallback';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { SearchInput } from 'src/ui/ui-kit/Input/SearchInput';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { SurfaceItemButton, SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { getRootDomNode } from 'src/ui/shared/getRootDomNode';
import * as styles from './styles.module.css';

type AddressPositionItem = Pick<
  AddressPosition,
  'id' | 'asset' | 'quantity' | 'chain'
>;

function ResultItem({ addressAsset }: { addressAsset: AddressPositionItem }) {
  const { asset } = addressAsset;
  const { price } = asset;
  const quantityCommon = baseToCommon(
    addressAsset.quantity || 0,
    getDecimals({
      asset,
      chain: createChain(addressAsset.chain),
    })
  );
  const details = [
    `${formatTokenValue(quantityCommon)} ${asset.symbol}`,
    price ? formatCurrencyValue(price.value, 'en', 'usd') : null,
  ].filter(Boolean);
  return (
    <HStack gap={4} justifyContent="space-between" alignItems="center">
      <Media
        image={
          <TokenIcon size={36} src={asset.icon_url} symbol={asset.symbol} />
        }
        text={<UIText kind="caption/accent">{asset.name}</UIText>}
        vGap={0}
        detailText={
          <UIText kind="caption/regular" color="var(--neutral-700)">
            {details[0]}
            {details.length > 1 ? ' · ' : null}
            {details[1]}
          </UIText>
        }
      />
      {price ? (
        <UIText kind="caption/accent" color="var(--black)">
          {formatCurrencyValue(quantityCommon.times(price.value), 'en', 'usd')}
        </UIText>
      ) : null}
    </HStack>
  );
}

interface Props {
  items: AddressPositionItem[];
  noItemsMessage: string;
  isLoading?: boolean;
  getGroupName?: (item: AddressPositionItem) => string;
  selectedItem: AddressPositionItem;
  onChange(position: AddressPositionItem): void;
  chain?: Chain | null;
}

enum ItemType {
  group,
  option,
}

type OptionItem =
  | { type: ItemType.group; name: string }
  | { type: ItemType.option; index: number };

const Option = React.memo(({ item }: { item: AddressPositionItem }) => {
  return <ResultItem addressAsset={item} />;
});

function matches(inputValue: string | null, { asset }: AddressPositionItem) {
  if (!inputValue) {
    return false;
  }
  const value = inputValue.toLowerCase();
  return (
    normalizedContains(asset.name.toLowerCase(), value) ||
    normalizedContains(asset.symbol.toLowerCase(), value)
  );
}

function improvedScrollToIndex<A extends Element, B extends Element>(
  virtualList: ReturnType<typeof useVirtualizer<A, B>>,
  listNode: HTMLElement,
  targetIndex: number
) {
  const virtualItem = virtualList
    .getVirtualItems()
    .find((row) => row.index === targetIndex);
  const currentOffset = listNode.scrollTop;
  const currentEnd = currentOffset + listNode.clientHeight;
  const isVisible = virtualItem
    ? (virtualItem.end > currentOffset && virtualItem.end < currentEnd) ||
      (virtualItem.start > currentOffset && virtualItem.start < currentEnd)
    : false;
  if (isVisible) {
    return;
  }
  virtualList.scrollToIndex(Math.max(0, targetIndex));
}

function findOptionIndex(itemIndex: number, groupIndexes: number[]) {
  let result = itemIndex;
  for (let i = 0; i < groupIndexes.length; i++) {
    if (groupIndexes[i] <= result) {
      result += 1;
    } else {
      break;
    }
  }
  return result;
}

const rootNode = getRootDomNode();

function AssetSelectComponent({
  items: allItems,
  isLoading,
  noItemsMessage,
  selectedItem,
  getGroupName,
  onChange,
  chain,
}: Props) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const debouncedSetQuery = useDebouncedCallback(setQuery, 500);
  // const isCombobox = allItems.length >= 10;
  // isCombobox: false doesn't seem to work as expected, the arrows do not work
  // and there is a rerender bug when Dialog is reopened, so we turn this mode off for now
  const isCombobox = true;

  const items = useMemo(() => {
    if (!query || !isCombobox) {
      return allItems;
    }
    return allItems.filter((item) => matches(query, item));
  }, [allItems, query, isCombobox]);

  const { optionItems, groupIndexes } = useMemo(() => {
    let lastGroupName: string | null = null;
    const groupIndexes: number[] = [];
    const result: Array<OptionItem> = [];
    let k = 0;
    for (let i = 0; i < items.length; i++) {
      const groupName = getGroupName?.(items[i]);
      if (groupName && groupName !== lastGroupName) {
        lastGroupName = groupName;
        result.push({ type: ItemType.group, name: groupName });
        groupIndexes.push(k);
        k++;
      }
      result.push({ type: ItemType.option, index: i });
      k++;
    }
    return { optionItems: result, groupIndexes };
  }, [getGroupName, items]);

  const ITEM_HEIGHT = 55;
  const FIRST_GROUP_NAME_HEIGHT = 24;
  const GROUP_NAME_HEIGHT = 36;
  const virtualList = useVirtualizer({
    count: optionItems.length,
    getScrollElement: () => listRef.current,
    estimateSize: useCallback(
      (index) =>
        optionItems[index].type === ItemType.option
          ? ITEM_HEIGHT
          : index === 0
          ? FIRST_GROUP_NAME_HEIGHT
          : GROUP_NAME_HEIGHT,
      [optionItems]
    ),
  });

  const {
    highlightedIndex,
    getToggleButtonProps,
    getItemProps,
    getMenuProps,
    getInputProps,
    closeMenu,
    setInputValue,
    setHighlightedIndex,
    selectItem,
  } = useCombobox<AddressPositionItem | null>({
    items,
    selectedItem,
    initialInputValue: '',
    getItemId: (index) => items[index]?.asset.id,
    itemToString: (item) => item?.asset.name || '',
    onInputValueChange: ({ inputValue }) => debouncedSetQuery(inputValue ?? ''),
    scrollIntoView: noop,
    onHighlightedIndexChange: ({ highlightedIndex }) => {
      if (
        highlightedIndex != null &&
        highlightedIndex !== -1 &&
        listRef.current
      ) {
        const targetIndex = findOptionIndex(highlightedIndex, groupIndexes);
        improvedScrollToIndex(virtualList, listRef.current, targetIndex);
      }
    },
    onStateChange: noop,
    onIsOpenChange: (changes) => {
      if (changes.isOpen) {
        dialogRef.current?.showModal();
        searchInputRef.current?.focus();
        const index = items.findIndex(
          (item) => item.asset.id === selectedItem.asset.id
        );
        if (index >= 0) {
          setHighlightedIndex(index);
        }
      } else {
        dialogRef.current?.close();
      }
      return changes;
    },
    stateReducer: (state, actionAndChanges) => {
      const { type, changes } = actionAndChanges;
      if (
        type === useCombobox.stateChangeTypes.ControlledPropUpdatedSelectedItem
      ) {
        return { ...changes, inputValue: state.inputValue };
      }
      return changes;
    },
    onSelectedItemChange: (s) => {
      if (!s.selectedItem) {
        return;
      }
      onChange(s.selectedItem);
      setInputValue('');
      closeMenu();
    },
  });

  const virtualListRef = useRef(virtualList);
  useEffect(() => {
    virtualListRef.current = virtualList;
  }, [virtualList]);
  useEffect(() => {
    virtualListRef.current?.scrollToOffset(0);
  }, [query]);

  const selectTimerRef = useRef<number | ReturnType<typeof setTimeout>>(0);
  useEffect(
    () => () => {
      clearTimeout(selectTimerRef.current);
    },
    []
  );
  const firstItem = items?.[0];
  const selectFirstItemWithDelay = useCallback(() => {
    if (!firstItem) {
      return;
    }
    clearTimeout(selectTimerRef.current);
    setHighlightedIndex(0);
    selectTimerRef.current = setTimeout(() => {
      selectItem(firstItem);
    }, 100);
  }, [firstItem, selectItem, setHighlightedIndex]);

  const selectedItemExistsInItems = useMemo(
    () => allItems.some((item) => item.id === selectedItem.id),
    [selectedItem, allItems]
  );

  const assetExistsOnChain =
    chain &&
    getAssetImplementationInChain({
      asset: selectedItem.asset,
      chain,
    });

  return (
    <div>
      <UnstyledButton
        {...getToggleButtonProps({
          tabIndex: 0,
          type: 'button',
          className: styles.select,
          style: { display: 'block' },
        })}
        {...(isCombobox ? {} : getInputProps())}
      >
        <HStack gap={8} alignItems="center">
          <TokenIcon
            size={20}
            src={selectedItem.asset.icon_url}
            symbol={selectedItem.asset.symbol}
            title={selectedItem.asset.name}
          />
          <HStack gap={4} alignItems="center">
            {selectedItem.asset.symbol.toUpperCase()}
            <DownIcon
              width={24}
              height={24}
              style={{
                position: 'relative',
                top: 2,
                color: 'var(--primary)',
              }}
            />
          </HStack>
          {isLoading ||
          (assetExistsOnChain && selectedItemExistsInItems) ? null : chain ? (
            <div
              style={{ display: 'flex' }}
              title={
                assetExistsOnChain
                  ? 'Asset is not available for transfer'
                  : 'Asset is not found on selected chain'
              }
            >
              <ErrorIcon color="var(--negative-500)" />
            </div>
          ) : null}
        </HStack>
      </UnstyledButton>
      {createPortal(
        <BottomSheetDialog
          ref={dialogRef}
          height="90vh"
          style={{ paddingTop: isCombobox ? 0 : 8 }}
          containerStyle={{
            paddingTop: isCombobox ? 0 : 8,
            paddingBottom: 0,
            paddingInline: 0,
            /* flex styles are importand so that listRef element has a limited height */
            display: 'flex',
            flexDirection: 'column',
          }}
          {...getMenuProps({ ref: dialogRef })}
          onClosed={closeMenu}
        >
          <div
            style={{
              display: isCombobox ? undefined : 'none',
              padding: 16,
              paddingTop: 12,
              position: 'sticky',
              width: '100%',
              top: 0,
              backgroundColor: 'var(--z-index-1)',
              zIndex: 1,
            }}
          >
            <SearchInput
              boxHeight={40}
              {...getInputProps({
                type: 'search',
                ref: searchInputRef,
                placeholder: 'Search tokens',
                onKeyDown: (event) => {
                  if (highlightedIndex === -1 && event.key === 'Enter') {
                    event.preventDefault();
                    selectFirstItemWithDelay();
                    return false;
                  }
                },
              })}
            />
          </div>
          {optionItems.length ? (
            <div
              ref={listRef}
              style={{
                overflowY: 'auto',
                paddingBottom: 8,
              }}
            >
              <SurfaceList
                style={{
                  height: virtualList.getTotalSize(),
                  position: 'relative',
                }}
                items={virtualList.getVirtualItems().map((row) => {
                  const optionItem = optionItems[row.index];
                  if (optionItem.type === ItemType.group) {
                    return {
                      key: optionItem.name,
                      component: (
                        <UIText
                          kind="body/accent"
                          color="var(--neutral-700)"
                          style={{
                            textTransform: 'uppercase',
                            paddingLeft: 20,
                            paddingRight: 20,
                            paddingTop: row.index === 0 ? 4 : 16,
                            paddingBottom: 8,

                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: row.size,
                            transform: `translateY(${row.start}px)`,
                          }}
                        >
                          {optionItem.name}
                        </UIText>
                      ),
                    };
                  } else if (optionItem.type === ItemType.option) {
                    const index = optionItem.index;
                    const item = items[index];

                    return {
                      key: item.asset.id,
                      isInteractive: true,
                      pad: false,
                      separatorTop: false,
                      component: (
                        <SurfaceItemButton
                          highlighted={highlightedIndex === index}
                          {...getItemProps({
                            item,
                            index,
                            style: {
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: row.size,
                              transform: `translateY(${row.start}px)`,
                            },
                          })}
                        >
                          <Option item={item} />
                        </SurfaceItemButton>
                      ),
                    };
                  } else {
                    // @ts-ignore unknown optionItem
                    throw new Error(`Unexpected ItemType: ${optionItem.type}`);
                  }
                })}
              />
            </div>
          ) : isLoading ? (
            <ViewLoading />
          ) : (
            <UIText kind="body/regular" style={{ padding: '8px 12px' }}>
              {noItemsMessage}
            </UIText>
          )}
        </BottomSheetDialog>,
        rootNode
      )}
    </div>
  );
}

export function AssetSelect({ items, selectedItem, ...props }: Props) {
  if (!items.length) {
    return (
      <div style={{ whiteSpace: 'nowrap' }}>
        <UIText kind="caption/accent">No Assets</UIText>
      </div>
    );
  }

  return (
    <AssetSelectComponent
      {...props}
      items={items}
      selectedItem={selectedItem}
    />
  );
}
