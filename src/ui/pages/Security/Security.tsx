import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { ViewSuspense } from 'src/ui/components/ViewSuspense';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { HStack } from 'src/ui/ui-kit/HStack';
import { AngleRightRow } from 'src/ui/components/AngleRightRow';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { UIText } from 'src/ui/ui-kit/UIText';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import { AUTO_LOCK_TIMER_OPTIONS_TITLES, AutoLockTimer } from './AutoLockTimer';

function SecurityMain() {
  const { globalPreferences } = useGlobalPreferences();

  return (
    <PageColumn>
      <PageTop />
      <SurfaceList
        items={[
          {
            key: 0,
            to: 'auto-lock-timer',
            component: (
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
                          globalPreferences.autoLockTimer
                        ]
                      }
                    </UIText>
                  ) : (
                    <CircleSpinner />
                  )}
                </HStack>
              </AngleRightRow>
            ),
          },
        ]}
      />
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
    </Routes>
  );
}
