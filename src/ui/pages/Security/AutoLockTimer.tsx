import { isTruthy } from 'is-truthy-ts';
import { useNavigate } from 'react-router-dom';
import React, { useEffect } from 'react';
import cn from 'classnames';
import type { GlobalPreferences } from 'src/shared/types/GlobalPreferences';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import { Button } from 'src/ui/ui-kit/Button';
import { Frame } from 'src/ui/ui-kit/Frame';
import { HStack } from 'src/ui/ui-kit/HStack';
import { FrameListItem } from 'src/ui/ui-kit/FrameList';
import { StickyBottomPanel } from 'src/ui/ui-kit/BottomPanel';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import CheckIcon from 'jsx:src/ui/assets/check.svg';
import { useBackgroundKind } from 'src/ui/components/Background';
import { collectData } from 'src/ui/shared/form-data';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import * as helperStyles from 'src/ui/style/helpers.module.css';
import * as styles from './styles.module.css';

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
  const navigate = useNavigate();

  useEffect(() => {
    if (mutation.isSuccess) {
      navigate(-1);
    }
  }, [mutation.isSuccess, navigate]);

  return (
    <PageColumn style={{ position: 'relative' }}>
      <NavigationTitle title="Auto-Lock Timer" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const { autoLockTimeout } = collectData(e.currentTarget, {
            autoLockTimeout: (value) =>
              value !== 'none' ? Number(value) : value,
          });
          setGlobalPreferences({ autoLockTimeout });
        }}
        style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}
      >
        <PageTop />
        <Frame>
          <VStack gap={0}>
            {AUTO_LOCK_TIMER_OPTIONS.map((preference) => (
              <label key={preference.value}>
                <input
                  type="radio"
                  name="autoLockTimeout"
                  value={preference.value}
                  defaultChecked={
                    preference.value === globalPreferences?.autoLockTimeout
                  }
                  className={cn(helperStyles.visuallyHiddenInput, styles.input)}
                />
                <FrameListItem className={styles.listItem}>
                  <HStack
                    gap={8}
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <UIText kind="body/accent">{preference.title}</UIText>
                    <CheckIcon
                      className={styles.checkIcon}
                      style={{
                        color: 'var(--primary)',
                        width: 24,
                        height: 24,
                      }}
                    />
                  </HStack>
                </FrameListItem>
              </label>
            ))}
          </VStack>
        </Frame>
        <Spacer height={16} />
        <StickyBottomPanel containerStyle={{ marginTop: 'auto' }}>
          <HStack
            gap={16}
            style={{ padding: 16, gridTemplateColumns: '1fr 1fr' }}
          >
            <Button
              kind="regular"
              type="button"
              onClick={() => {
                setGlobalPreferences({ autoLockTimeout: TWELVE_HOURS });
              }}
            >
              Reset
            </Button>
            <Button kind="primary">Save</Button>
          </HStack>
        </StickyBottomPanel>
      </form>
    </PageColumn>
  );
}
