import React, { useState, useMemo, useRef } from 'react';
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
import { useSearchKeyboardNavigation } from 'src/ui/components/NetworkSelectDialog/useSearchKeyboardNavigation';
import { SurfaceItemLink, SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import type { Fungible } from 'src/modules/zerion-api/types/Fungible';
import { useBackgroundKind } from 'src/ui/components/Background';
import { whiteBackgroundKind } from 'src/ui/components/Background/Background';
import { EmptyView } from 'src/ui/components/EmptyView';
import { Media } from 'src/ui/ui-kit/Media';
import VerifiedIcon from 'jsx:src/ui/assets/verified.svg';
import { HStack } from 'src/ui/ui-kit/HStack/HStack';
import { useSearchQuery } from './useSearchQuery';

const SEARCH_RESULT_CLASS = 'search-result';

function SearchResultItem({
  fungible,
  index,
}: {
  fungible: Fungible;
  index: number;
}) {
  const { currency } = useCurrency();

  return (
    <SurfaceItemLink
      to={`/asset/${fungible.id}`}
      data-class={SEARCH_RESULT_CLASS}
      data-index={index}
      style={{ padding: '4px 0' }}
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
    itemClassName: SEARCH_RESULT_CLASS,
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
          <VStack gap={16} style={{ alignItems: 'center', paddingInline: 8 }}>
            <CircleSpinner />
            <UIText kind="body/regular" color="var(--neutral-500)">
              Searching...
            </UIText>
          </VStack>
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
        ) : null}
      </PageColumn>
    </>
  );
}
