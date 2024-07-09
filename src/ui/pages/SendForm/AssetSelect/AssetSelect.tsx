import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
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
import type { Item } from 'src/ui/ui-kit/SurfaceList';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { getRootDomNode } from 'src/ui/shared/getRootDomNode';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { ZStack } from 'src/ui/ui-kit/ZStack';
import * as helperStyles from 'src/ui/style/helpers.module.css';
import { useCustomValidity } from 'src/ui/shared/forms/useCustomValidity';
import { useCurrency } from 'src/modules/currency/useCurrency';
import type { BareAddressPosition } from '../../SwapForm/BareAddressPosition';
import * as styles from './styles.module.css';

function ResultItem({ addressAsset }: { addressAsset: BareAddressPosition }) {
  const { currency } = useCurrency();
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
    `${formatTokenValue(quantityCommon)}`,
    asset.symbol,
    price ? formatCurrencyValue(price.value, 'en', currency) : null,
  ].filter(Boolean);

  return (
    <HStack gap={4} justifyContent="space-between" alignItems="center">
      <Media
        image={
          <TokenIcon size={36} src={asset.icon_url} symbol={asset.symbol} />
        }
        text={
          <UIText
            kind="body/accent"
            style={{
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            {asset.name}
          </UIText>
        }
        vGap={0}
        detailText={
          <UIText kind="small/regular" color="var(--neutral-700)">
            <HStack
              gap={4}
              style={{
                gridTemplateColumns:
                  'minmax(min-content, max-content) auto 1fr',
                whiteSpace: 'nowrap',
              }}
            >
              {details[0]}
              <div
                style={{
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
              >
                {details[1]}
              </div>
              {details.length > 2 ? ' · ' : null}
              {details[2]}
            </HStack>
          </UIText>
        }
      />
      {price ? (
        <UIText kind="body/accent" color="var(--black)">
          {formatCurrencyValue(
            quantityCommon.times(price.value),
            'en',
            currency
          )}
        </UIText>
      ) : null}
    </HStack>
  );
}

export interface Props {
  items: BareAddressPosition[];
  filterItemsLocally?: boolean;
  noItemsMessage: string;
  isLoading?: boolean;
  getGroupName?: (item: BareAddressPosition) => string;
  selectedItem: BareAddressPosition;
  onChange(position: BareAddressPosition): void;
  chain?: Chain | null;
  pagination?: {
    fetchMore: () => void;
    hasMore: boolean;
    isLoading: boolean;
  };
  renderListTitle?: () => React.ReactNode;
  onQueryDidChange?: (query: string) => void;
  dialogTitle: React.ReactNode | null;
  onClosed?: () => void;
}

enum ItemType {
  group,
  option,
  loadMoreButton,
}

type LoadMoreOption = { type: ItemType.loadMoreButton; index: number };
type OptionItem =
  | { type: ItemType.group; name: string }
  | { type: ItemType.option; index: number }
  | LoadMoreOption;

const isOptionItem = (
  value: OptionItem | BareAddressPosition
): value is BareAddressPosition => {
  return 'asset' in value;
};
const isButtonOptionItem = (
  value: OptionItem | BareAddressPosition | null | undefined
): value is LoadMoreOption => {
  return value
    ? 'type' in value && value.type === ItemType.loadMoreButton
    : false;
};

const Option = React.memo(({ item }: { item: BareAddressPosition }) => {
  return <ResultItem addressAsset={item} />;
});

function matches(inputValue: string | null, { asset }: BareAddressPosition) {
  if (!inputValue) {
    return false;
  }
  const value = inputValue.toLowerCase();
  return (
    normalizedContains(asset.name.toLowerCase(), value) ||
    normalizedContains(asset.symbol.toLowerCase(), value) ||
    normalizedContains(asset.asset_code.toLowerCase(), value)
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
  filterItemsLocally = true,
  isLoading,
  noItemsMessage,
  selectedItem,
  getGroupName,
  onChange,
  chain,
  pagination,
  renderListTitle,
  onQueryDidChange,
  dialogTitle,
  onClosed,
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

  useEffect(() => {
    onQueryDidChange?.(query);
  }, [onQueryDidChange, query]);

  const hasMore = pagination?.hasMore;

  const items = useMemo(() => {
    let result: typeof allItems = [];
    if (!query || !isCombobox || !filterItemsLocally) {
      result = allItems;
    } else {
      result = allItems.filter((item) => matches(query, item));
    }
    const loadMoreButton: LoadMoreOption = {
      type: ItemType.loadMoreButton,
      index: result.length,
    };
    return [...result, ...(hasMore ? [loadMoreButton] : [])];
  }, [hasMore, query, isCombobox, allItems, filterItemsLocally]);

  const { optionItems, groupIndexes } = useMemo(() => {
    let lastGroupName: string | null = null;
    const groupIndexes: number[] = [];
    const result: Array<OptionItem> = [];
    let k = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (isButtonOptionItem(item)) {
        result.push(item as { type: ItemType.loadMoreButton; index: number });
      } else {
        const groupName = getGroupName?.(item);
        if (groupName && groupName !== lastGroupName) {
          lastGroupName = groupName;
          result.push({ type: ItemType.group, name: groupName });
          groupIndexes.push(k);
          k++;
        }
        result.push({ type: ItemType.option, index: i });
      }
      k++;
    }
    return { optionItems: result, groupIndexes };
  }, [getGroupName, items]);

  const ITEM_HEIGHT = 60;
  const LOAD_MORE_BUTTON_HEIGHT = 40;
  const FIRST_GROUP_NAME_HEIGHT = 28;
  const GROUP_NAME_HEIGHT = 28;
  const virtualList = useVirtualizer({
    count: optionItems.length,
    getScrollElement: () => listRef.current,
    paddingEnd: 16,
    estimateSize: useCallback(
      (index) =>
        optionItems[index].type === ItemType.option
          ? ITEM_HEIGHT
          : optionItems[index].type === ItemType.loadMoreButton
          ? LOAD_MORE_BUTTON_HEIGHT
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
  } = useCombobox<BareAddressPosition | LoadMoreOption | null>({
    items,
    selectedItem,
    initialInputValue: '',
    getItemId: (index) => {
      const item = items[index];
      return item && isButtonOptionItem(item) ? 'load-more' : item?.asset.id;
    },
    itemToString: (item) => {
      // return item?.asset.name || ''
      return item ? (isButtonOptionItem(item) ? '' : item?.asset.name) : '';
    },
    onInputValueChange: ({ inputValue }) => debouncedSetQuery(inputValue ?? ''),
    scrollIntoView: noop,
    onHighlightedIndexChange: ({ highlightedIndex }) => {
      if (
        highlightedIndex != null &&
        highlightedIndex !== -1 &&
        listRef.current
      ) {
        // TODO: for some reason the virtualList doesn't correctly scroll to an
        // element on "open" event if the highlighted element is located a bit above
        // the last scroll portion of the view
        // I tried calling the virtualList.scrollToIndex(targetIndex) directly,
        // but it doesn't help
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
          (item) =>
            isOptionItem(item) && item.asset.id === selectedItem.asset.id
        );
        Object.assign(window, { virtualList });
        if (index >= 0) {
          setHighlightedIndex(index);
        }
      } else {
        dialogRef.current?.close();
        onClosed?.();
      }
      return changes;
    },
    stateReducer: (state, actionAndChanges) => {
      const { type, changes } = actionAndChanges;
      if (
        type === useCombobox.stateChangeTypes.ControlledPropUpdatedSelectedItem
      ) {
        return { ...changes, inputValue: state.inputValue };
      } else if (
        type === useCombobox.stateChangeTypes.ItemClick ||
        type === useCombobox.stateChangeTypes.InputKeyDownEnter
      ) {
        // TODO: undoing item select
        if (isButtonOptionItem(changes.selectedItem)) {
          return {
            ...changes,
            selectedItem,
            inputValue: query,
            isOpen: true,
            highlightedIndex: state.highlightedIndex,
          };
        }
      }
      return changes;
    },
    onSelectedItemChange: (s) => {
      if (!s.selectedItem) {
        return;
      }
      if (isOptionItem(s.selectedItem)) {
        onChange(s.selectedItem);
        setInputValue('');
        closeMenu();
      }
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

  const assetExistsOnChain =
    chain &&
    getAssetImplementationInChain({
      asset: selectedItem.asset,
      chain,
    });

  const listItems: Item[] = virtualList.getVirtualItems().map((row) => {
    const optionItem = optionItems[row.index];
    if (optionItem.type === ItemType.group) {
      return {
        key: optionItem.name,
        component: (
          <UIText
            kind="caption/accent"
            color="var(--neutral-700)"
            style={{
              // textTransform: 'uppercase',
              paddingLeft: 20,
              paddingRight: 20,
              // paddingTop: row.index === 0 ? 4 : 16,
              paddingTop: 8,
              paddingBottom: 4,

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
      if (!isOptionItem(item)) {
        throw new Error('Invalid Option');
      }

      return {
        key: item.asset.id,
        isInteractive: true,
        pad: false,
        separatorTop: false,
        component: (
          <SurfaceItemButton
            highlighted={highlightedIndex === index}
            decorationStyle={
              selectedItem.id === item.id
                ? { outline: '1px solid var(--primary)', outlineOffset: -1 }
                : undefined
            }
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
    } else if (optionItem.type === ItemType.loadMoreButton) {
      const index = optionItem.index;

      return {
        key: 'load-more',
        isInteractive: true,
        pad: false,
        separatorTop: false,
        component: (
          <SurfaceItemButton
            highlighted={highlightedIndex === index}
            {...getItemProps({
              item: null,
              index,
              type: 'button',
              onClick: () => pagination?.fetchMore(),
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
            <UIText kind="body/regular" color="var(--primary)">
              Load More
            </UIText>
          </SurfaceItemButton>
        ),
      };
    } else {
      // @ts-ignore unknown optionItem
      throw new Error(`Unexpected ItemType: ${optionItem.type}`);
    }
  });

  // This is a helper input that serves only to provide native form validation
  const readonlyInputRef = useRef<HTMLInputElement | null>(null);
  useCustomValidity({
    ref: readonlyInputRef,
    customValidity: assetExistsOnChain
      ? ''
      : 'Asset is not found on selected chain',
  });

  return (
    <div>
      <ZStack>
        <input
          ref={readonlyInputRef}
          className={helperStyles.visuallyHiddenInput}
          style={{ placeSelf: 'center' }}
          type="readonly"
        />
        <UnstyledButton
          {...getToggleButtonProps({
            tabIndex: 0,
            type: 'button',
            className: styles.select,
            style: { display: 'block', overflowWrap: 'break-word' },
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
            <HStack
              gap={4}
              alignItems="center"
              style={{
                textAlign: 'start',
                fontSize:
                  selectedItem.asset.symbol.length > 8 ? '0.8em' : undefined,
              }}
            >
              {selectedItem.asset.symbol}
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
            {!isLoading && chain && !assetExistsOnChain ? (
              <div
                style={{ display: 'flex' }}
                title="Asset is not found on selected chain"
              >
                <ErrorIcon color="var(--negative-500)" />
              </div>
            ) : null}
          </HStack>
        </UnstyledButton>
      </ZStack>
      {createPortal(
        <BottomSheetDialog
          ref={dialogRef}
          height="90vh"
          style={{ paddingTop: isCombobox ? 0 : 8 }}
          containerStyle={{
            paddingBottom: 0,
            paddingInline: 0,
            paddingTop: dialogTitle ? 16 : 0,
            /* flex styles are importand so that listRef element has a limited height */
            display: 'flex',
            flexDirection: 'column',
          }}
          {...getMenuProps({ ref: dialogRef })}
          onClosed={closeMenu}
        >
          {dialogTitle ? (
            <div style={{ paddingInline: 16 }}>
              <DialogTitle
                title={<UIText kind="headline/h3">{dialogTitle}</UIText>}
                alignTitle="start"
              />
            </div>
          ) : null}
          <div
            style={{
              display: isCombobox ? undefined : 'none',
              padding: 16,
              width: '100%',
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
                  } else if (
                    event.key === 'Enter' &&
                    pagination &&
                    isButtonOptionItem(items[highlightedIndex])
                  ) {
                    setHighlightedIndex(highlightedIndex);
                    pagination.fetchMore();
                  }
                },
              })}
              // useCombobox selects current item on blur, but because we're using
              // a BottomSheet dialog, this feels like unexpected behavior
              onBlur={noop}
            />
          </div>
          {renderListTitle?.() ?? null}
          {optionItems.length ? (
            <div ref={listRef} style={{ overflowY: 'auto' }}>
              <SurfaceList
                style={{
                  height: virtualList.getTotalSize(),
                  position: 'relative',
                  opacity: pagination?.isLoading ? 0.5 : 1,
                  ['--surface-background-color' as string]: 'transparent',
                }}
                items={listItems}
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
  if (!items.length && !selectedItem) {
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
