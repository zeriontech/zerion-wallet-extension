import React, { useMemo, useCallback } from 'react';
import { useCombobox } from 'downshift';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { SearchInput } from 'src/ui/ui-kit/Input/SearchInput/SearchInput';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { formatPriceValue } from 'src/shared/units/formatPriceValue';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useDebouncedCallback } from 'src/ui/shared/useDebouncedCallback';
import { PageTop } from 'src/ui/components/PageTop';
import type { Item } from 'src/ui/ui-kit/SurfaceList';
import { SurfaceItemLink, SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import type { Fungible } from 'src/modules/zerion-api/types/Fungible';
import { useBackgroundKind } from 'src/ui/components/Background';
import { whiteBackgroundKind } from 'src/ui/components/Background/Background';
import { EmptyView } from 'src/ui/components/EmptyView';
import { Media } from 'src/ui/ui-kit/Media';
import VerifiedIcon from 'jsx:src/ui/assets/verified.svg';
import { HStack } from 'src/ui/ui-kit/HStack/HStack';
import { walletPort } from 'src/ui/shared/channels';
import { usePreferences } from 'src/ui/features/preferences';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import CloseIcon from 'jsx:src/ui/assets/close.svg';
import { useAssetFullInfo } from 'src/modules/zerion-api/hooks/useAssetFullInfo';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import { invariant } from 'src/shared/invariant';
import { Button } from 'src/ui/ui-kit/Button';
import { useEvent } from 'src/ui/shared/useEvent';
import { updateRecentSearch } from './updateRecentSearch';
import { useSearchQuery } from './useSearchQuery';

const FungibleView = React.forwardRef<
  HTMLAnchorElement,
  {
    fungible: Fungible;
    index: number;
    highlighted?: boolean;
    onClick: () => void;
  }
>(({ fungible, highlighted, onClick }, ref) => {
  const { currency } = useCurrency();
  return (
    <SurfaceItemLink
      ref={ref}
      to={`/asset/${fungible.id}`}
      style={{ padding: '4px 0' }}
      highlighted={highlighted}
      onClick={onClick}
    >
      <Media
        image={
          <TokenIcon
            src={fungible.iconUrl}
            symbol={fungible.symbol}
            size={36}
            title={fungible.name}
          />
        }
        vGap={0}
        alignItems="center"
        text={
          <HStack
            gap={4}
            alignItems="center"
            style={{ gridTemplateColumns: 'minmax(0, 1fr) auto' }}
          >
            <UIText
              kind="body/accent"
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={fungible.name}
            >
              {fungible.name}
            </UIText>
            {fungible.verified ? <VerifiedIcon /> : null}
          </HStack>
        }
        detailText={
          fungible.meta.price ? (
            <UIText kind="small/regular" color="var(--neutral-500)">
              {formatPriceValue(fungible.meta.price, 'en', currency)}
            </UIText>
          ) : null
        }
      />
    </SurfaceItemLink>
  );
});

const SearchResultItem = React.forwardRef<
  HTMLAnchorElement,
  {
    fungible: Fungible;
    index: number;
    highlighted?: boolean;
    onClick: () => void;
  }
>(({ fungible, index, highlighted, onClick }, ref) => {
  return (
    <FungibleView
      fungible={fungible}
      index={index}
      highlighted={highlighted}
      onClick={onClick}
      ref={ref}
    />
  );
});

const RecentItem = React.forwardRef<
  HTMLAnchorElement,
  {
    fungibleId: string;
    index: number;
    highlighted?: boolean;
    onClick: () => void;
  }
>(({ fungibleId, index, highlighted, onClick }, ref) => {
  const { currency } = useCurrency();
  const { preferences, setPreferences } = usePreferences();

  const { data, isLoading } = useAssetFullInfo(
    { fungibleId, currency },
    { source: useHttpClientSource() }
  );

  const fungible = data?.data.fungible;

  const handleRemoveItemClick = useCallback(() => {
    if (preferences) {
      setPreferences({
        recentSearch: preferences.recentSearch.filter(
          (id) => id !== fungibleId
        ),
      });
    }
  }, [fungibleId, preferences, setPreferences]);

  if (!isLoading && !fungible) {
    return null;
  }

  if (isLoading) {
    return <div style={{ height: 68 }} />;
  }

  invariant(fungible, 'Fungible data for recent search should be defined');

  return (
    <HStack
      gap={4}
      justifyContent="space-between"
      alignItems="center"
      style={{ gridTemplateColumns: '1fr auto' }}
    >
      <FungibleView
        ref={ref}
        fungible={fungible}
        index={index}
        highlighted={highlighted}
        onClick={onClick}
      />
      <Button
        kind="ghost"
        style={{ display: 'flex' }}
        size={28}
        aria-label="Remove item from recent"
        onClick={handleRemoveItemClick}
      >
        <CloseIcon
          style={{ width: 20, height: 20, color: 'var(--neutral-500)' }}
        />
      </Button>
    </HStack>
  );
});

type SearchPageItem =
  | { kind: 'recent'; fungibleId: string }
  | { kind: 'result'; fungibleId: string; fungible: Fungible };

export function Search() {
  useBackgroundKind(whiteBackgroundKind);
  const { currency } = useCurrency();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('query') || '';
  const setSearchParamsEvent = useEvent((value: string) => {
    setSearchParams(value ? { query: value } : {}, { replace: true });
  });
  const debouncedSetSearchParams = useDebouncedCallback(
    setSearchParamsEvent,
    500
  );
  const normalizedQuery = urlQuery.trim();

  const { preferences, setPreferences } = usePreferences();
  const { data: searchResults, isLoading } = useSearchQuery({
    query: normalizedQuery,
    currency,
  });

  const recentItems = useMemo<SearchPageItem[]>(() => {
    return (
      preferences?.recentSearch.map((id) => ({
        kind: 'recent',
        fungibleId: id,
      })) || []
    );
  }, [preferences]);

  const searchItems = useMemo<SearchPageItem[]>(() => {
    return (
      searchResults?.data.fungibles?.map((fungible) => ({
        kind: 'result',
        fungibleId: fungible.id,
        fungible,
      })) || []
    );
  }, [searchResults]);

  const items = normalizedQuery ? searchItems : recentItems;

  const handleFungibleClick = useCallback(
    (fungibleId: string) => {
      if (preferences) {
        setPreferences({
          recentSearch: updateRecentSearch(
            fungibleId,
            preferences.recentSearch
          ),
        });
      }
      walletPort.request('assetClicked', {
        assetId: fungibleId,
        pathname,
        section: 'Search',
      });
      navigate(`/asset/${fungibleId}`);
    },
    [navigate, pathname, preferences, setPreferences]
  );

  const { getItemProps, getInputProps, getMenuProps, highlightedIndex } =
    useCombobox<SearchPageItem>({
      isOpen: true,
      items,
      itemToString: (item) => item?.fungibleId || '',
      onInputValueChange: ({ inputValue }) => {
        debouncedSetSearchParams(inputValue || '');
      },
      defaultInputValue: urlQuery,
      onSelectedItemChange: ({ selectedItem }) => {
        const fungibleId = selectedItem?.fungibleId;
        if (!fungibleId) {
          return;
        }
        handleFungibleClick(fungibleId);
      },
      stateReducer: (state, actionAndChanges) => {
        const { changes, type } = actionAndChanges;
        switch (type) {
          case useCombobox.stateChangeTypes.InputKeyDownEnter:
          case useCombobox.stateChangeTypes.ItemClick: {
            /**
             * By default, downshift fills input with the full name
             * of selected item; we want to avoid this, because
             * the server search doesn't work well with spaces
             * Also, keeping user-entered value is better UX in our case, because
             * the user gets can see other results sooner when he reopens the menu
             */
            return { ...changes, inputValue: state.inputValue };
          }
        }
        return changes;
      },
    });

  const surfaceItems = useMemo<Item[]>(() => {
    return items.map((item, index) => {
      if (item.kind === 'recent') {
        return {
          key: item.fungibleId,
          isInteractive: true,
          pad: false,
          component: (
            <RecentItem
              fungibleId={item.fungibleId}
              highlighted={highlightedIndex === index}
              {...getItemProps({
                item,
                index,
                onClick: () => handleFungibleClick(item.fungibleId),
              })}
            />
          ),
        } as Item;
      } else {
        return {
          key: item.fungibleId,
          isInteractive: true,
          pad: false,
          component: (
            <SearchResultItem
              fungible={item.fungible}
              highlighted={highlightedIndex === index}
              {...getItemProps({
                item,
                index,
                onClick: () => handleFungibleClick(item.fungibleId),
              })}
            />
          ),
        } as Item;
      }
    });
  }, [items, getItemProps, highlightedIndex, handleFungibleClick]);

  const handleClearRecentClick = useCallback(() => {
    setPreferences({ recentSearch: [] });
  }, [setPreferences]);

  return (
    <>
      <NavigationTitle title="Search" />
      <PageColumn
        style={{
          ['--column-padding-inline' as string]: '8px',
        }}
      >
        <PageTop />
        <div style={{ paddingInline: 8 }}>
          <SearchInput
            boxHeight={40}
            {...getInputProps({
              placeholder: 'Search tokens',
              type: 'search',
              autoFocus: true,
            })}
          />
        </div>

        <Spacer height={24} />

        <VStack gap={4}>
          {normalizedQuery ? (
            <UIText kind="body/accent" style={{ paddingInline: 8 }}>
              Results
            </UIText>
          ) : preferences?.recentSearch.length ? (
            <HStack gap={4} justifyContent="space-between" alignItems="center">
              <UIText kind="body/accent" style={{ paddingInline: 8 }}>
                Recent
              </UIText>
              <UIText kind="body/accent" color="var(--neutral-500)">
                <UnstyledButton
                  className="hover:underline"
                  aria-label="Clear recent search"
                  onClick={handleClearRecentClick}
                >
                  Clear
                </UnstyledButton>
              </UIText>
            </HStack>
          ) : null}
          {normalizedQuery && isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <CircleSpinner />
            </div>
          ) : normalizedQuery && surfaceItems.length === 0 ? (
            <EmptyView>No results</EmptyView>
          ) : null}
          <SurfaceList
            {...getMenuProps()}
            style={{
              paddingBlock: 0,
              ['--surface-background-color' as string]: 'transparent',
            }}
            items={surfaceItems}
          />
        </VStack>
      </PageColumn>
    </>
  );
}
