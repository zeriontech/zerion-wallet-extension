import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from 'src/ui/ui-kit/Button';
import ConnectionIconOn from 'jsx:src/ui/assets/pause-feature-on.svg';
import ConnectionIconOff from 'jsx:src/ui/assets/pause-feature-off.svg';
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
import { ViewLoading } from '../ViewLoading';
import type { SubmitData } from './actions';
import {
  TESTING,
  TurnOffDuration,
  createInjectionPreference,
  disableInjectionPreference,
} from './actions';

function PauseInjectionDialog({
  activeTabUrl,
  onSubmit,
}: {
  activeTabUrl: URL | null;
  onSubmit: (data: SubmitData) => void;
}) {
  invariant(activeTabUrl != null, '`activeTabUrl` is required');

  const buttons = [
    {
      value: TurnOffDuration.oneHour,
      label: `For 1 Hour${TESTING ? ' (40 sec for testing)' : ''}`,
    },
    // { value: TurnOffDuration.untilTomorrow, label: 'Pause until Tomorrow' },
    { value: TurnOffDuration.forever, label: 'Forever' },
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
      const data = naiveFormDataToObject<{ duration: TurnOffDuration }>(
        new (FormData as FormDataWithSubmitter)(
          event.currentTarget as HTMLFormElement,
          event.submitter
        ),
        (key, value) => (key === 'duration' ? Number(value) : (value as string))
      );
      onSubmitRef.current({
        origin: data.origin as string,
        duration: data.duration,
      });
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
      <UIText kind="headline/h2" style={{ textAlign: 'center' }}>
        Disable Zerion for
        <br />
        <span
          style={{ color: 'var(--neutral-500)', overflowWrap: 'break-word' }}
        >
          {activeTabUrl?.hostname}
        </span>
      </UIText>
      <form ref={formRef}>
        <input type="hidden" name="origin" value={activeTabUrl.origin} />
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
        height="fit-content"
        onClosed={handleDialogDismiss}
        containerStyle={{ backgroundColor: 'var(--z-index-0)' }}
      >
        {showPauseDialog ? (
          <>
            <PauseInjectionDialog
              activeTabUrl={tabUrl || null}
              onSubmit={(formData) => {
                setGlobalPreferences(
                  createInjectionPreference(globalPreferences, formData)
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
        style={{ padding: 0, cursor: isPaused ? 'auto' : undefined }}
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
            width: 36,
            height: 36,
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
        <UIText kind="body/regular" color="var(--notice-500)">
          Paused for
        </UIText>
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
            disableInjectionPreference(globalPreferences, pattern)
          ).then(reloadActiveTab)
        }
      >
        <UIText kind="small/accent">Resume</UIText>
      </Button>
    </HStack>
  );
}
