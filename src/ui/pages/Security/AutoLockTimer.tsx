import React from 'react';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Radio } from 'src/ui/ui-kit/Radio';
import { SurfaceItemLabel, SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

const DEBUG_SPEED_UP = true;

const AUTO_LOCK_TIMER_OPTIONS_PROD: { title: string; value: number }[] = [
  { title: '1 Minute', value: 1000 * 60 },
  { title: '10 Minutes', value: 1000 * 60 * 10 },
  { title: '1 Hour', value: 1000 * 60 * 60 },
  { title: '12 Hours', value: 1000 * 60 * 60 * 12 },
  { title: '24 Hours', value: 1000 * 60 * 60 * 24 },
  { title: 'None', value: 0 },
];

const AUTO_LOCK_TIMER_OPTIONS_DEBUG: { title: string; value: number }[] = [
  { title: '1 Minute', value: 1000 * 60 },
  { title: '2 Minutes', value: 1000 * 60 * 2 },
  { title: '3 Minutes', value: 1000 * 60 * 3 },
  { title: '5 Minutes', value: 1000 * 60 * 5 },
  { title: '10 Minutes', value: 1000 * 60 * 10 },
  { title: '24 Hours', value: 1000 * 60 * 60 * 24 },
  { title: 'None', value: 0 },
];

const AUTO_LOCK_TIMER_OPTIONS = DEBUG_SPEED_UP
  ? AUTO_LOCK_TIMER_OPTIONS_DEBUG
  : AUTO_LOCK_TIMER_OPTIONS_PROD;

export const AUTO_LOCK_TIMER_OPTIONS_TITLES = Object.fromEntries(
  Object.values(AUTO_LOCK_TIMER_OPTIONS).map(({ title, value }) => [
    value,
    title,
  ])
);

export function AutoLockTimer() {
  const { globalPreferences, setGlobalPreferences } = useGlobalPreferences();
  const value = globalPreferences?.autoLockTimeout;

  return (
    <PageColumn>
      <NavigationTitle title="Auto-Lock Timer" />
      <PageTop />
      <VStack gap={8}>
        <SurfaceList
          items={AUTO_LOCK_TIMER_OPTIONS.map((preference, index) => ({
            key: index,
            isInteractive: true,
            pad: false,
            component: (
              <SurfaceItemLabel>
                <UIText
                  kind="body/regular"
                  color={
                    value === preference.value ? 'var(--primary)' : undefined
                  }
                >
                  <HStack
                    gap={8}
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <span>{preference.title}</span>
                    <Radio
                      name="preference"
                      value={preference.value}
                      checked={value === preference.value}
                      onChange={() =>
                        setGlobalPreferences({
                          autoLockTimeout: preference.value,
                        })
                      }
                    />
                  </HStack>
                </UIText>
              </SurfaceItemLabel>
            ),
          }))}
        />
      </VStack>
      <PageBottom />
    </PageColumn>
  );
}
