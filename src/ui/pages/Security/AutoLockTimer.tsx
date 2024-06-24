import { isTruthy } from 'is-truthy-ts';
import React, { useEffect } from 'react';
import type { GlobalPreferences } from 'src/shared/types/GlobalPreferences';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import { Frame } from 'src/ui/ui-kit/Frame';
import { HStack } from 'src/ui/ui-kit/HStack';
import { FrameListItemButton } from 'src/ui/ui-kit/FrameList';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import CheckIcon from 'jsx:src/ui/assets/check.svg';
import { useBackgroundKind } from 'src/ui/components/Background';
import { useGoBack } from 'src/ui/shared/navigation/useGoBack';

const isDev = process.env.NODE_ENV === 'development';

type TimerOptions = Array<{
  title: string;
  value: GlobalPreferences['autoLockTimeout'];
}>;

const TWELVE_HOURS = 1000 * 60 * 60 * 12;

const AUTO_LOCK_TIMER_OPTIONS = [
  { title: '1 Minute', value: 1000 * 60 },
  isDev ? { title: '2 Minutes', value: 1000 * 60 * 2 } : null,
  isDev ? { title: '3 Minutes', value: 1000 * 60 * 3 } : null,
  isDev ? { title: '5 Minutes', value: 1000 * 60 * 5 } : null,
  { title: '10 Minutes', value: 1000 * 60 * 10 },
  { title: '1 Hour', value: 1000 * 60 * 60 },
  { title: '12 Hours', value: TWELVE_HOURS },
  { title: '24 Hours', value: 1000 * 60 * 60 * 24 },
  { title: 'None', value: 'none' } as const,
].filter(isTruthy) satisfies TimerOptions;

export const AUTO_LOCK_TIMER_OPTIONS_TITLES = Object.fromEntries(
  Object.values(AUTO_LOCK_TIMER_OPTIONS).map(({ title, value }) => [
    value,
    title,
  ])
);

export function AutoLockTimer() {
  const { globalPreferences, setGlobalPreferences, mutation } =
    useGlobalPreferences();
  useBackgroundKind({ kind: 'white' });
  const goBack = useGoBack();

  useEffect(() => {
    if (mutation.isSuccess) {
      goBack();
    }
  }, [mutation.isSuccess, goBack]);

  return (
    <PageColumn style={{ position: 'relative' }}>
      <NavigationTitle title="Auto-Lock Timer" />
      <PageTop />
      <Frame>
        <VStack gap={0}>
          {AUTO_LOCK_TIMER_OPTIONS.map((preference) => (
            <FrameListItemButton
              key={preference.value}
              onClick={() =>
                setGlobalPreferences({ autoLockTimeout: preference.value })
              }
            >
              <HStack
                gap={8}
                alignItems="center"
                justifyContent="space-between"
              >
                <UIText kind="body/accent">{preference.title}</UIText>
                {preference.value === globalPreferences?.autoLockTimeout ? (
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
