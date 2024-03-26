import { isTruthy } from 'is-truthy-ts';
import React, { useState } from 'react';
import type { GlobalPreferences } from 'src/shared/types/GlobalPreferences';
import { Background } from 'src/ui/components/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import { Button } from 'src/ui/ui-kit/Button';
import { Frame } from 'src/ui/ui-kit/Frame/Frame';
import { HStack } from 'src/ui/ui-kit/HStack';
import { ListItemButton } from 'src/ui/ui-kit/List/ListItem';
import { AnimatedBottomPanel } from 'src/ui/ui-kit/BottomPanel/BottomPanel';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import CheckIcon from 'jsx:src/ui/assets/check.svg';
import { Spacer } from 'src/ui/ui-kit/Spacer';

const isDev = process.env.NODE_ENV === 'development';

type TimerOptions = Array<{
  title: string;
  value: GlobalPreferences['autoLockTimeout'];
}>;

const AUTO_LOCK_TIMER_OPTIONS = [
  { title: '1 Minute', value: 1000 * 60 },
  isDev ? { title: '2 Minutes', value: 1000 * 60 * 2 } : null,
  isDev ? { title: '3 Minutes', value: 1000 * 60 * 3 } : null,
  isDev ? { title: '5 Minutes', value: 1000 * 60 * 5 } : null,
  { title: '10 Minutes', value: 1000 * 60 * 10 },
  { title: '1 Hour', value: 1000 * 60 * 60 },
  { title: '12 Hours', value: 1000 * 60 * 60 * 12 },
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
  const { globalPreferences, setGlobalPreferences } = useGlobalPreferences();
  const value = globalPreferences?.autoLockTimeout;
  const [selectedValue, setSelectedValue] = useState<
    GlobalPreferences['autoLockTimeout'] | null
  >(null);

  const isNewValue = Boolean(selectedValue && selectedValue !== value);

  return (
    <Background backgroundKind="white">
      <PageColumn style={{ position: 'relative' }}>
        <NavigationTitle title="Auto-Lock Timer" />
        <PageTop />
        <Frame>
          <VStack gap={0}>
            {AUTO_LOCK_TIMER_OPTIONS.map((preference) => (
              <ListItemButton
                key={preference.value}
                onClick={() => setSelectedValue(preference.value)}
              >
                <HStack
                  gap={8}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <UIText kind="body/accent">{preference.title}</UIText>
                  {!isNewValue && preference.value === value ? (
                    <CheckIcon
                      style={{ color: 'var(--primary)', width: 24, height: 24 }}
                    />
                  ) : isNewValue && preference.value === selectedValue ? (
                    <CheckIcon
                      style={{
                        color: 'var(--neutral-800)',
                        width: 24,
                        height: 24,
                      }}
                    />
                  ) : null}
                </HStack>
              </ListItemButton>
            ))}
          </VStack>
        </Frame>
        {isNewValue ? <Spacer height={76} /> : null}
        <PageBottom />
        <AnimatedBottomPanel animated={true} show={isNewValue}>
          <HStack
            gap={16}
            style={{ padding: 16, gridTemplateColumns: '1fr 1fr' }}
          >
            <Button kind="regular" onClick={() => setSelectedValue(null)}>
              Reset
            </Button>
            <Button
              kind="primary"
              onClick={() => {
                if (!selectedValue) {
                  return;
                }
                setGlobalPreferences({
                  autoLockTimeout: selectedValue,
                });
              }}
            >
              Save
            </Button>
          </HStack>
        </AnimatedBottomPanel>
      </PageColumn>
    </Background>
  );
}
