import React, { useCallback } from 'react';
import { Route, Routes } from 'react-router-dom';
import { CURRENCIES } from 'src/modules/currency/currencies';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { AngleRightRow } from 'src/ui/components/AngleRightRow';
import { useBackgroundKind } from 'src/ui/components/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { ViewSuspense } from 'src/ui/components/ViewSuspense';
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

  return (
    <PageColumn>
      <NavigationTitle title="Currency" />
      <PageTop />

      <Frame>
        <VStack gap={0}>
          {Object.values(CURRENCIES).map(({ code, name, symbol }) => (
            <FrameListItemButton key={code} onClick={() => setCurrency(code)}>
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
                    {symbol}
                  </UIText>
                  <UIText kind="body/accent">{name}</UIText>
                </HStack>
                {code === currency ? (
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
          ))}
        </VStack>
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
