import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from 'src/ui/ui-kit/Button';
import ConnectionIconOn from 'jsx:src/ui/assets/connection-toggle-on.svg';
import ConnectionIconOff from 'jsx:src/ui/assets/connection-toggle-off.svg';
import CloseIcon from 'jsx:src/ui/assets/close.svg';
import { UIText } from 'src/ui/ui-kit/UIText';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { invariant } from 'src/shared/invariant';
import { getActiveTabOrigin } from 'src/ui/shared/requests/getActiveTabOrigin';
import { VStack } from 'src/ui/ui-kit/VStack';
import { HStack } from 'src/ui/ui-kit/HStack';
import { naiveFormDataToObject } from 'src/ui/shared/form-data';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import { reloadActiveTab } from 'src/ui/shared/reloadActiveTab';
import { RadioCard } from 'src/ui/ui-kit/Radio/Radio';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { ViewLoading } from '../ViewLoading';
import * as styles from './styles.module.css';
import type { SubmitData } from './actions';
import {
  TESTING,
  TurnOffDuration,
  createPreference,
  disablePreference,
} from './actions';

function PauseInjectionDialog({
  activeTabUrl,
  onSubmit,
}: {
  activeTabUrl: URL | null;
  onSubmit: (data: SubmitData) => void;
}) {
  const options: Array<{
    value: string;
    subtitle: string;
    title: string;
    defaultChecked: boolean;
  }> = [];

  if (activeTabUrl) {
    options.push({
      value: activeTabUrl.origin,
      subtitle: activeTabUrl.hostname,
      title: 'Current Dapp',
      defaultChecked: true,
    });
  }
  options.push({
    value: '<all_urls>',
    subtitle: 'Disable for all',
    title: 'Any Dapps',
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
    <VStack
      gap={24}
      style={{
        position: 'relative',
        minHeight: '100%',
      }}
    >
      <VStack gap={8} style={{ justifyItems: 'center', textAlign: 'center' }}>
        <UIText kind="headline/h2">Wallet Visibility</UIText>
        <UIText
          kind="caption/regular"
          color="var(--neutral-500)"
          style={{ paddingInline: 32 }}
        >
          Pause Zerion for the current Dapp, or disable it entirely, allowing
          you to use other wallet extensions
        </UIText>
      </VStack>
      <form ref={formRef}>
        <VStack gap={16}>
          <HStack
            gap={8}
            style={{ width: '100%', gridTemplateColumns: '1fr 1fr' }}
          >
            {options.map((option) => (
              <RadioCard
                className={styles.radioCard}
                key={option.value}
                name="origin"
                value={option.value}
                defaultChecked={option.defaultChecked}
                required={true}
              >
                <VStack gap={4} style={{ padding: '12px 16px' }}>
                  <Spacer height={24} />
                  <div className={styles.radioCardTitle}>
                    <UIText kind="headline/h3">{option.title}</UIText>
                  </div>
                  <UIText
                    kind="small/regular"
                    title={option.subtitle}
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {option.subtitle}
                  </UIText>
                </VStack>
              </RadioCard>
            ))}
          </HStack>
          <VStack gap={4}>
            {buttons.map((button) => (
              <Button
                key={button.value}
                size={48}
                name="duration"
                kind="neutral"
                value={button.value}
              >
                <UIText kind="body/accent">{button.label}</UIText>
              </Button>
            ))}
          </VStack>
        </VStack>
      </form>
    </VStack>
  );
}

export function usePausedData() {
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
        height={416}
        onClosed={handleDialogDismiss}
        containerStyle={{ backgroundColor: 'var(--z-index-0)' }}
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
              aria-label="Close"
              style={{
                position: 'absolute',
                width: 40,
                top: 8,
                right: 8,
                padding: 8,
              }}
            >
              <CloseIcon style={{ display: 'block' }} />
            </Button>
          </>
        ) : null}
      </BottomSheetDialog>

      <Button
        kind="neutral"
        size={36}
        type="button"
        title="Disable Wallet Provider"
        style={{
          padding: 8,
          ['--button-background' as string]: 'var(--white)',
          ['--button-background-hover' as string]: 'var(--white)',
          ['--button-text-hover' as string]: 'var(--neutral-800)',
          cursor: isPaused ? 'auto' : undefined,
        }}
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
            width: 20,
            height: 20,
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

export function PausedHeader() {
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
    <HStack
      gap={8}
      justifyContent="space-between"
      alignItems="center"
      style={{ gridTemplateColumns: '1fr auto' }}
    >
      <HStack
        gap={4}
        alignItems="center"
        style={{ gridTemplateColumns: 'auto 1fr' }}
      >
        <UIText kind="body/regular">Paused for</UIText>
        {isPausedForAll ? (
          <UIText kind="body/accent" color="var(--notice-600)" inline={true}>
            All DApps
          </UIText>
        ) : (
          <UIText
            kind="body/accent"
            inline={true}
            title={tabUrl?.hostname || 'current tab'}
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {tabUrl?.hostname || 'current tab'}
          </UIText>
        )}
      </HStack>
      <Button
        kind="neutral"
        size={36}
        style={{
          paddingInline: 24,
          ['--button-background' as string]: 'var(--white)',
          ['--button-background-hover' as string]: 'var(--neutral-200)',
        }}
        onClick={() =>
          setGlobalPreferences(
            disablePreference(globalPreferences, pattern)
          ).then(reloadActiveTab)
        }
      >
        <UIText kind="small/accent">Resume</UIText>
      </Button>
    </HStack>
  );
}
