import React, { useCallback, useMemo, useState } from 'react';
import { useCombobox } from 'downshift';
import { normalizedContains } from 'normalized-contains';
import { Route, Routes } from 'react-router-dom';
import type { CurrencyConfig } from 'src/modules/currency/currencies';
import { CURRENCIES } from 'src/modules/currency/currencies';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { AngleRightRow } from 'src/ui/components/AngleRightRow';
import { useBackgroundKind } from 'src/ui/components/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { ViewSuspense } from 'src/ui/components/ViewSuspense';
import { SearchInput } from 'src/ui/ui-kit/Input/SearchInput';
import { Frame } from 'src/ui/ui-kit/Frame';
import {
  FrameListItemButton,
  FrameListItemLink,
} from 'src/ui/ui-kit/FrameList';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import CheckIcon from 'jsx:src/ui/assets/check.svg';
import { preferenceStore } from 'src/ui/features/appearance';
import { useGoBack } from 'src/ui/shared/navigation/useGoBack';

const allCurrencies = Object.values(CURRENCIES);

function matchesCurrency(query: string, item: CurrencyConfig) {
  const value = query.toLowerCase();
  return (
    normalizedContains(item.name.toLowerCase(), value) ||
    normalizedContains(item.symbol.toLowerCase(), value) ||
    normalizedContains(item.code.toLowerCase(), value)
  );
}

function CurrencyPage() {
  const { currency } = useCurrency();
  useBackgroundKind({ kind: 'white' });
  const goBack = useGoBack();

  const setCurrency = useCallback(
    (value: string) => {
      preferenceStore.setState((current) => ({
        ...current,
        currency: value,
      }));
      goBack();
    },
    [goBack]
  );

  const [query, setQuery] = useState('');

  const filteredItems = useMemo(
    () =>
      query
        ? allCurrencies.filter((item) => matchesCurrency(query, item))
        : allCurrencies,
    [query]
  );

  const { getInputProps, getMenuProps, getItemProps, highlightedIndex } =
    useCombobox<CurrencyConfig>({
      items: filteredItems,
      isOpen: true,
      itemToString: (item) => item?.code ?? '',
      onInputValueChange: ({ inputValue }) => setQuery(inputValue ?? ''),
      stateReducer: (_state, actionAndChanges) => {
        const { changes, type } = actionAndChanges;
        if (
          type === useCombobox.stateChangeTypes.InputKeyDownEnter ||
          type === useCombobox.stateChangeTypes.ItemClick
        ) {
          return { ...changes, inputValue: _state.inputValue, isOpen: true };
        }
        return changes;
      },
      onSelectedItemChange: ({ selectedItem }) => {
        if (selectedItem) {
          setCurrency(selectedItem.code);
        }
      },
    });

  return (
    <PageColumn>
      <NavigationTitle title="Currency" />
      <PageTop />

      <SearchInput
        boxHeight={40}
        {...getInputProps({
          placeholder: 'Search currency',
          type: 'search',
          autoFocus: true,
        })}
      />

      <Frame style={{ marginTop: 8 }}>
        <div {...getMenuProps()}>
          <VStack gap={0}>
            {filteredItems.length === 0 ? (
              <UIText
                kind="body/regular"
                color="var(--neutral-500)"
                style={{ padding: 16, textAlign: 'center' }}
              >
                No currencies found
              </UIText>
            ) : (
              filteredItems.map((item, index) => (
                <FrameListItemButton
                  key={item.code}
                  style={
                    highlightedIndex === index
                      ? { backgroundColor: 'var(--neutral-100)' }
                      : undefined
                  }
                  {...getItemProps({ item, index })}
                >
                  <HStack
                    gap={8}
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <HStack gap={8} alignItems="center">
                      <UIText
                        kind="headline/h3"
                        style={{ width: 24, textAlign: 'center' }}
                      >
                        {item.symbol}
                      </UIText>
                      <UIText kind="body/accent">{item.name}</UIText>
                    </HStack>
                    {item.code === currency ? (
                      <CheckIcon
                        style={{
                          color: 'var(--primary)',
                          width: 24,
                          height: 24,
                        }}
                      />
                    ) : null}
                  </HStack>
                </FrameListItemButton>
              ))
            )}
          </VStack>
        </div>
      </Frame>
    </PageColumn>
  );
}

function PreferencesMain() {
  const { currency } = useCurrency();
  useBackgroundKind({ kind: 'white' });

  return (
    <PageColumn>
      <NavigationTitle title="Preferences" />
      <PageTop />
      <Frame>
        <VStack gap={0}>
          <FrameListItemLink to="currency">
            <AngleRightRow>
              <HStack
                gap={24}
                alignItems="center"
                justifyContent="space-between"
              >
                <UIText kind="body/accent">Currency</UIText>
                <UIText kind="small/regular" color="var(--neutral-500)">
                  {CURRENCIES[currency].code.toUpperCase()}
                </UIText>
              </HStack>
            </AngleRightRow>
          </FrameListItemLink>
        </VStack>
      </Frame>
      <PageBottom />
    </PageColumn>
  );
}

export function PreferencesPage() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ViewSuspense>
            <PreferencesMain />
          </ViewSuspense>
        }
      />
      <Route
        path="/currency"
        element={
          <ViewSuspense>
            <CurrencyPage />
          </ViewSuspense>
        }
      />
    </Routes>
  );
}
