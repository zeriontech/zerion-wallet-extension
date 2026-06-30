import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from 'src/ui/ui-kit/Button';
import ConnectionIconOn from 'jsx:src/ui/assets/pause-feature-on.svg';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Dialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { AngleRightRow } from 'src/ui/components/AngleRightRow';
import { FrameListItemButton } from 'src/ui/ui-kit/FrameList';
import { StickyBottomPanel } from 'src/ui/ui-kit/BottomPanel';
import { invariant } from 'src/shared/invariant';
import { getActiveTabOrigin } from 'src/ui/shared/requests/getActiveTabOrigin';
import { VStack } from 'src/ui/ui-kit/VStack';
import { HStack } from 'src/ui/ui-kit/HStack';
import { naiveFormDataToObject } from 'src/ui/shared/form-data';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import { reloadActiveTab } from 'src/ui/shared/reloadActiveTab';
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
    <VStack gap={24}>
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

/**
 * Settings-list row that opens the disable-provider duration chooser
 * (For 1 Hour / Forever), scoped to the active tab's origin. Relocated here
 * from the (retired) Overview connection header.
 */
export function DisableWalletProviderSettingsItem() {
  const {
    isPaused,
    isPausedForAll,
    tabUrl,
    globalPreferences,
    setGlobalPreferences,
  } = usePausedData();
  const [showDialog, setShowDialog] = useState(false);

  if (!globalPreferences || !tabUrl) {
    return null;
  }
  return (
    <>
      <FrameListItemButton
        onClick={() => setShowDialog(true)}
        disabled={isPaused}
      >
        <AngleRightRow>
          <HStack gap={8} alignItems="center">
            <ConnectionIconOn
              style={{
                width: 24,
                height: 24,
                color: isPausedForAll
                  ? 'var(--notice-600)'
                  : isPaused
                  ? 'var(--neutral-500)'
                  : undefined,
              }}
            />
            <UIText kind="body/regular">Disable Zerion</UIText>
          </HStack>
        </AngleRightRow>
      </FrameListItemButton>
      <Dialog2
        open={showDialog}
        onClose={() => setShowDialog(false)}
        size="content"
      >
        <div style={{ paddingInline: 16, paddingBlock: 24 }}>
          <PauseInjectionDialog
            activeTabUrl={tabUrl || null}
            onSubmit={(formData) => {
              setGlobalPreferences(
                createInjectionPreference(globalPreferences, formData)
              ).then(reloadActiveTab);
              setShowDialog(false);
            }}
          />
        </div>
      </Dialog2>
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

/**
 * Floating "Paused for X · Resume" banner pinned over the bottom of Overview
 * (same sticky panel as the Settings Lock Wallet button). Renders nothing when
 * provider injection isn't paused.
 */
export function PausedBanner() {
  const { isPaused, globalPreferences } = usePausedData();
  if (!isPaused || !globalPreferences) {
    return null;
  }
  return (
    <StickyBottomPanel
      style={{
        padding: '12px 16px',
        ['--background-color' as string]: 'var(--neutral-100)',
      }}
    >
      <PausedHeader />
    </StickyBottomPanel>
  );
}
