import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
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
import { useSearchKeyboardNavigation } from 'src/ui/shared/useSearchKeyboardNavigation';
import { SurfaceItemLink, SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
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
import { updateRecentSearch } from './updateRecentSearch';
import { useSearchQuery } from './useSearchQuery';

const SEARCH_ITEM_CLASS = 'search-page-fungible-item';

function FungibleView({
  fungible,
  index,
  onClick,
}: {
  fungible: Fungible;
  index: number;
  onClick: (fungible: Fungible) => void;
}) {
  const { currency } = useCurrency();
  return (
    <SurfaceItemLink
      to={`/asset/${fungible.id}`}
      data-class={SEARCH_ITEM_CLASS}
      data-index={index}
      style={{ padding: '4px 0' }}
      onClick={() => onClick(fungible)}
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
}

function SearchResultItem({
  fungible,
  index,
}: {
  fungible: Fungible;
  index: number;
}) {
  const { pathname } = useLocation();
  const { preferences, setPreferences } = usePreferences();

  const handleSearchItemClick = useCallback(
    (fungible: Fungible) => {
      if (preferences) {
        setPreferences({
          resentSearch: updateRecentSearch(
            fungible.id,
            preferences.resentSearch
          ),
        });
      }
      walletPort.request('assetClicked', {
        assetId: fungible.id,
        assetName: fungible.name,
        pathname,
        section: 'Search',
      });
    },
    [pathname, preferences, setPreferences]
  );

  return (
    <FungibleView
      fungible={fungible}
      index={index}
      onClick={handleSearchItemClick}
    />
  );
}

function RecentItem({
  fungibleId,
  index,
}: {
  fungibleId: string;
  index: number;
}) {
  const { currency } = useCurrency();
  const { pathname } = useLocation();
  const { preferences, setPreferences } = usePreferences();

  const { data, isLoading } = useAssetFullInfo(
    { fungibleId, currency },
    { source: useHttpClientSource() }
  );

  const fungible = data?.data.fungible;

  const handleItemClick = useCallback(
    (fungible: Fungible) => {
      walletPort.request('assetClicked', {
        assetId: fungible.id,
        assetName: fungible.name,
        pathname,
        section: 'Search',
      });
    },
    [pathname]
  );

  const handleRemoveItemClick = useCallback(() => {
    if (preferences) {
      setPreferences({
        resentSearch: preferences.resentSearch.filter(
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
        fungible={fungible}
        index={index}
        onClick={handleItemClick}
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
}

function RecentSearchList() {
  const { preferences, setPreferences } = usePreferences();

  const items = useMemo(() => {
    return preferences?.resentSearch.map((fungibleId, index) => ({
      key: fungibleId,
      isInteractive: true,
      pad: false,
      component: <RecentItem fungibleId={fungibleId} index={index} />,
    }));
  }, [preferences?.resentSearch]);

  const handleClearClick = useCallback(() => {
    if (preferences) {
      setPreferences({ resentSearch: [] });
    }
  }, [preferences, setPreferences]);

  if (!preferences || !preferences.resentSearch?.length) {
    return null;
  }

  return (
    <VStack gap={4}>
      <HStack gap={4} justifyContent="space-between" alignItems="center">
        <UIText kind="body/accent" style={{ paddingInline: 8 }}>
          Recent
        </UIText>
        <UIText kind="body/accent" color="var(--neutral-500)">
          <UnstyledButton
            className="hover:underline"
            aria-label="Clear recent search"
            onClick={handleClearClick}
          >
            Clear
          </UnstyledButton>
        </UIText>
      </HStack>
      <SurfaceList
        style={{
          paddingBlock: 0,
          ['--surface-background-color' as string]: 'transparent',
        }}
        items={items || []}
      />
    </VStack>
  );
}

export function Search() {
  useBackgroundKind(whiteBackgroundKind);
  const { currency } = useCurrency();
  const [query, setQuery] = useState('');
  const debouncedHandleChange = useDebouncedCallback(setQuery, 300);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const normalizedQuery = query.trim();

  const { data: searchResults, isLoading } = useSearchQuery(
    normalizedQuery,
    currency
  );

  const fungibles = useMemo(() => {
    return searchResults?.data?.fungibles || [];
  }, [searchResults]);

  const {
    selectNext: selectNextResult,
    selectPrev: selectPrevResult,
    focusSearchInput,
  } = useSearchKeyboardNavigation({
    itemClassName: SEARCH_ITEM_CLASS,
    searchRef,
  });

  const items = useMemo(() => {
    return fungibles.map((fungible, index) => ({
      key: fungible.id,
      isInteractive: true,
      pad: false,
      component: <SearchResultItem fungible={fungible} index={index} />,
    }));
  }, [fungibles]);

  return (
    <>
      <KeyboardShortcut combination="f" onKeyDown={focusSearchInput} />
      <KeyboardShortcut combination="ArrowDown" onKeyDown={selectNextResult} />
      <KeyboardShortcut combination="ArrowUp" onKeyDown={selectPrevResult} />
      <NavigationTitle title="Search" />
      <PageColumn
        style={{
          ['--column-padding-inline' as string]: '8px',
        }}
      >
        <PageTop />
        <div style={{ paddingInline: 8 }}>
          <SearchInput
            ref={searchRef}
            type="search"
            placeholder="Search tokens"
            autoFocus={true}
            boxHeight={40}
            onChange={(e) => debouncedHandleChange(e.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                selectNextResult();
              }
            }}
          />
        </div>

        <Spacer height={24} />

        {isLoading && normalizedQuery ? (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <CircleSpinner />
          </div>
        ) : normalizedQuery && fungibles.length === 0 ? (
          <EmptyView>No results</EmptyView>
        ) : fungibles.length > 0 ? (
          <VStack gap={4}>
            <UIText kind="body/accent" style={{ paddingInline: 8 }}>
              Results
            </UIText>
            <SurfaceList
              style={{
                paddingBlock: 0,
                ['--surface-background-color' as string]: 'transparent',
              }}
              items={items}
            />
          </VStack>
        ) : (
          <RecentSearchList />
        )}
      </PageColumn>
    </>
  );
}
