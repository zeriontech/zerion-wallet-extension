import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { ViewSuspense } from 'src/ui/components/ViewSuspense';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { HStack } from 'src/ui/ui-kit/HStack';
import { AngleRightRow } from 'src/ui/components/AngleRightRow';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { UIText } from 'src/ui/ui-kit/UIText';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import { Frame } from 'src/ui/ui-kit/Frame';
import { FrameListItemLink } from 'src/ui/ui-kit/FrameList';
import { useBackgroundKind } from 'src/ui/components/Background';
import { VStack } from 'src/ui/ui-kit/VStack';
import { AUTO_LOCK_TIMER_OPTIONS_TITLES, AutoLockTimer } from './AutoLockTimer';
import { ChangePasswordRoutes } from './ChangePassword';

function SecurityMain() {
  const { globalPreferences } = useGlobalPreferences();
  useBackgroundKind({ kind: 'white' });

  return (
    <PageColumn>
      <PageTop />
      <VStack gap={8}>
        <Frame>
          <VStack gap={0}>
            <FrameListItemLink to="auto-lock-timer">
              <AngleRightRow>
                <HStack
                  gap={24}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <UIText kind="body/accent">Auto-Lock Timer</UIText>
                  {globalPreferences ? (
                    <UIText kind="small/regular" color="var(--neutral-500)">
                      {
                        AUTO_LOCK_TIMER_OPTIONS_TITLES[
                          globalPreferences.autoLockTimeout
                        ]
                      }
                    </UIText>
                  ) : (
                    <CircleSpinner />
                  )}
                </HStack>
              </AngleRightRow>
            </FrameListItemLink>
          </VStack>
        </Frame>
        <Frame>
          <VStack gap={0}>
            <FrameListItemLink to="change-password">
              <AngleRightRow>
                <HStack
                  gap={24}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <VStack gap={0}>
                    <UIText kind="body/accent">Change Password</UIText>
                    <UIText kind="small/regular" color="var(--neutral-500)">
                      Or verify that you remember your existing one
                    </UIText>
                  </VStack>
                </HStack>
              </AngleRightRow>
            </FrameListItemLink>
          </VStack>
        </Frame>
      </VStack>
    </PageColumn>
  );
}

export function Security() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ViewSuspense>
            <SecurityMain />
          </ViewSuspense>
        }
      />
      <Route
        path="/auto-lock-timer"
        element={
          <ViewSuspense>
            <AutoLockTimer />
          </ViewSuspense>
        }
      />
      <Route
        path="/change-password/*"
        element={
          <ViewSuspense>
            <ChangePasswordRoutes />
          </ViewSuspense>
        }
      />
    </Routes>
  );
}
