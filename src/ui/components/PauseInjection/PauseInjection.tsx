import React, { useCallback, useEffect, useRef, useState } from 'react';
import { produce } from 'immer';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { Button } from 'src/ui/ui-kit/Button';
import ConnectionIconOn from 'jsx:src/ui/assets/connection-toggle-on.svg';
import ConnectionIconOff from 'jsx:src/ui/assets/connection-toggle-off.svg';
import CloseIcon from 'jsx:src/ui/assets/close.svg';
import { Media } from 'src/ui/ui-kit/Media';
import { UIText } from 'src/ui/ui-kit/UIText';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { invariant } from 'src/shared/invariant';
import { getActiveTabOrigin } from 'src/ui/shared/requests/getActiveTabOrigin';
import { VStack } from 'src/ui/ui-kit/VStack';
import {
  SurfaceList,
  SurfaceItemLabel,
  SurfaceItemButton,
} from 'src/ui/ui-kit/SurfaceList';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Radio } from 'src/ui/ui-kit/Radio';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { naiveFormDataToObject } from 'src/ui/shared/form-data';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import { Surface } from 'src/ui/ui-kit/Surface';
import * as s from 'src/ui/style/helpers.module.css';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import type { GlobalPreferences } from 'src/shared/types/GlobalPreferences';
import { reloadActiveTab } from 'src/ui/shared/reloadActiveTab';
import { ViewLoading } from '../ViewLoading';

const TESTING = process.env.NODE_ENV !== 'production';

enum TurnOffDuration {
  oneHour,
  untilTomorrow,
  forever,
}

interface SubmitData {
  origin: '<all_urls>' | string;
  duration: TurnOffDuration;
}

function PauseInjectionDialog({
  activeTabUrl,
  onSubmit,
}: {
  activeTabUrl: URL | null;
  onSubmit: (data: SubmitData) => void;
}) {
  const options: Array<{
    value: string;
    label: string;
    defaultChecked: boolean;
  }> = [];
  if (activeTabUrl) {
    options.push({
      value: activeTabUrl.origin,
      label: `For ${activeTabUrl.hostname}`,
      defaultChecked: true,
    });
  }
  options.push({
    value: '<all_urls>',
    label: 'For all DApps',
    defaultChecked: !activeTabUrl,
  });
  const buttons = [
    {
      value: TurnOffDuration.oneHour,
      label: `Pause for 1 Hour${TESTING ? ' (40 sec for testing)' : ''}`,
    },
    { value: TurnOffDuration.untilTomorrow, label: 'Pause until Tomorrow' },
    { value: TurnOffDuration.forever, label: 'Turn Off' },
  ];
  const formRef = useRef<HTMLFormElement | null>(null);
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;

  useEffect(() => {
    invariant(formRef.current, 'Form not found');
    const { current: form } = formRef;
    function handleSubmit(event: SubmitEvent) {
      event.preventDefault();
      interface FormDataWithSubmitter extends FormData {
        new (form?: HTMLFormElement, submitter?: HTMLElement | null): FormData;
      }
      const data = naiveFormDataToObject(
        new (FormData as FormDataWithSubmitter)(
          event.currentTarget as HTMLFormElement,
          event.submitter
        ),
        (key, value) => (key === 'duration' ? Number(value) : (value as string))
      );
      onSubmitRef.current(data as unknown as SubmitData);
    }
    /**
     * NOTE: we add a 'submit' listener instead of using `onSubmit` prop
     * because we need to access the `event.submitter` property
     */
    form.addEventListener('submit', handleSubmit);
    return () => {
      form.removeEventListener('submit', handleSubmit);
    };
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      <div>
        <Media
          image={
            <ConnectionIconOn
              style={{ width: 56, height: 56, color: 'var(--positive-400)' }}
            />
          }
          text={
            <UIText kind="body/regular">
              Zerion is your default wallet for
            </UIText>
          }
          vGap={0}
          detailText={
            activeTabUrl ? (
              <UIText kind="headline/h3" style={{ wordBreak: 'break-all' }}>
                {activeTabUrl.hostname}
              </UIText>
            ) : null
          }
        />
        <Spacer height={24} />
        <form ref={formRef}>
          <VStack gap={8}>
            <UIText kind="small/accent" color="var(--neutral-500)">
              Pause Zerion Extension
            </UIText>

            <SurfaceList
              gap={4}
              style={{ paddingBlock: 4 }}
              items={options.map((option) => ({
                key: option.value,
                isInteractive: true,
                pad: false,
                component: (
                  <SurfaceItemLabel>
                    <UIText kind="body/accent">
                      <HStack
                        gap={8}
                        alignItems="center"
                        justifyContent="space-between"
                        style={{ paddingBlock: 4 }}
                      >
                        <span style={{ wordBreak: 'break-all' }}>
                          {option.label}
                        </span>
                        <Radio
                          name="origin"
                          value={option.value}
                          defaultChecked={option.defaultChecked}
                          required={true}
                          style={{
                            ['--radio-size' as string]: '20px',
                            ['--radio-core-size' as string]: '12px',
                          }}
                        />
                      </HStack>
                    </UIText>
                  </SurfaceItemLabel>
                ),
              }))}
            />

            <SurfaceList
              gap={4}
              style={{ paddingBlock: 4 }}
              items={buttons.map((button) => ({
                key: button.value,
                pad: false,
                isInteractive: true,
                component: (
                  <SurfaceItemButton name="duration" value={button.value}>
                    <UIText
                      kind="body/accent"
                      color="var(--primary)"
                      style={{ paddingBlock: 4 }}
                    >
                      {button.label}
                    </UIText>
                  </SurfaceItemButton>
                ),
              }))}
            />
            <UIText kind="caption/regular" color="var(--neutral-500)">
              Pause Zerion for the current DApp, or disable it entirely,
              allowing you to use other wallet extensions
            </UIText>
          </VStack>
        </form>
      </div>
    </div>
  );
}

function calculateExpires(duration: TurnOffDuration) {
  if (duration === TurnOffDuration.oneHour) {
    const FORTY_SECONDS = 1000 * 40;
    const HOUR = 1000 * 60 * 60;
    return Date.now() + (TESTING ? FORTY_SECONDS : HOUR);
  } else if (duration === TurnOffDuration.untilTomorrow) {
    const now = dayjs();
    if (now.hour() < 3) {
      return now.hour(9).valueOf(); // 9AM same day
    } else {
      return now.add(1, 'day').hour(9).valueOf(); // 9AM next day
    }
  } else if (duration === TurnOffDuration.forever) {
    return null;
  }
  throw new Error('Unexpected duration enum');
}

function usePausedData() {
  const { data: tabData } = useQuery({
    queryKey: ['activeTab/origin'],
    queryFn: getActiveTabOrigin,
  });
  const { globalPreferences, mutation } = useGlobalPreferences();
  const tabUrl = tabData?.url;
  const protocol = tabUrl?.protocol;
  const tabUrlHttp =
    protocol === 'https:' || protocol === 'http:' ? tabUrl : undefined;
  const isPausedForAll = Boolean(
    globalPreferences?.providerInjection['<all_urls>']
  );
  const isPaused =
    isPausedForAll ||
    (tabUrlHttp
      ? Boolean(globalPreferences?.providerInjection[tabUrlHttp.origin])
      : false);
  return {
    tabUrl: tabUrlHttp,
    isPaused,
    pattern: isPausedForAll ? '<all_urls>' : tabUrlHttp?.origin ?? null,
    isPausedForAll,
    globalPreferences,
    setGlobalPreferences: mutation.mutateAsync,
    tabData,
  };
}

function createPreference(
  globalPreferences: GlobalPreferences,
  formData: SubmitData
): Pick<GlobalPreferences, 'providerInjection'> {
  return {
    providerInjection: {
      ...globalPreferences.providerInjection,
      [formData.origin]: {
        expires: calculateExpires(formData.duration),
      },
    },
  };
}

function disablePreference(
  globalPreferences: GlobalPreferences,
  pattern: string | null
): Pick<GlobalPreferences, 'providerInjection'> {
  if (!globalPreferences.providerInjection || !pattern) {
    return {};
  }
  return {
    providerInjection: produce(globalPreferences.providerInjection, (draft) => {
      delete draft[pattern];
    }),
  };
}

export function PauseInjectionControl() {
  const {
    isPaused,
    isPausedForAll,
    tabUrl,
    globalPreferences,
    setGlobalPreferences,
  } = usePausedData();
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);

  const handleDialogDismiss = useCallback(() => {
    dialogRef.current?.close();
    setShowPauseDialog(false);
  }, []);

  if (!globalPreferences) {
    return <ViewLoading />;
  }
  return (
    <>
      <BottomSheetDialog
        ref={dialogRef}
        height={472}
        containerStyle={{
          backgroundColor: 'var(--background)',
          ['--surface-background-color' as string]: 'var(--white)',
        }}
      >
        {showPauseDialog ? (
          <>
            <PauseInjectionDialog
              activeTabUrl={tabUrl || null}
              onSubmit={(formData) => {
                setGlobalPreferences(
                  createPreference(globalPreferences, formData)
                ).then(reloadActiveTab);
                handleDialogDismiss();
              }}
            />
            <Button
              onClick={handleDialogDismiss}
              kind="ghost"
              size={40}
              style={{
                position: 'absolute',
                width: 40,
                top: 8,
                right: 8,
                padding: 8,
              }}
            >
              <CloseIcon />
            </Button>
          </>
        ) : null}
      </BottomSheetDialog>

      <Button
        kind="ghost"
        size={40}
        type="button"
        title="Disable Wallet Provider"
        style={{ width: 40, paddingInline: 8 }}
        disabled={isPaused}
        onClick={() => {
          invariant(dialogRef.current, 'Dialog element must be mounted');
          dialogRef.current.showModal();
          setShowPauseDialog(true);
        }}
      >
        {React.createElement(isPaused ? ConnectionIconOff : ConnectionIconOn, {
          style: {
            display: 'block',
            color: isPausedForAll
              ? 'var(--notice-600)'
              : isPaused
              ? 'var(--neutral-500)'
              : undefined,
          },
        })}
      </Button>
    </>
  );
}

export function PausedBanner({ style }: { style?: React.CSSProperties }) {
  const {
    isPaused,
    isPausedForAll,
    pattern,
    tabUrl,
    globalPreferences,
    setGlobalPreferences,
  } = usePausedData();
  if (!isPaused || !globalPreferences) {
    return null;
  }
  return (
    <Surface
      style={{
        paddingBlock: 8,
        paddingInline: 12,
        ['--surface-border-radius' as string]: '8px',
        ['--surface-background-color' as string]: 'var(--white)',
        ...style,
      }}
    >
      <HStack gap={8} justifyContent="space-between">
        <UIText kind="small/regular">
          Paused for{' '}
          {isPausedForAll ? (
            <UIText kind="small/accent" color="var(--notice-600)" inline={true}>
              All DApps
            </UIText>
          ) : (
            <UIText kind="small/accent" inline={true}>
              {tabUrl?.hostname || 'current tab'}
            </UIText>
          )}
        </UIText>
        <UnstyledButton
          className={s.hoverUnderline}
          style={{ color: 'var(--primary)' }}
          onClick={() =>
            setGlobalPreferences(
              disablePreference(globalPreferences, pattern)
            ).then(reloadActiveTab)
          }
        >
          <UIText kind="small/accent">Resume</UIText>
        </UnstyledButton>
      </HStack>
    </Surface>
  );
}
