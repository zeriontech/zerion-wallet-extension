import React, { useRef } from 'react';
import { useId, useMemo } from 'react';
import { useStore } from '@store-unit/react';
import QuestionHintIcon from 'jsx:src/ui/assets/question-hint.svg';
import { useBodyStyle } from 'src/ui/components/Background/Background';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import { HStack } from 'src/ui/ui-kit/HStack/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Toggle } from 'src/ui/ui-kit/Toggle';
import { urlContext } from 'src/shared/UrlContext';
import { ZStack } from 'src/ui/ui-kit/ZStack';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { TextLink } from 'src/ui/ui-kit/TextLink';
import { testnetModeStore } from '../store';
import { usePreferences } from '../../preferences';

export function TestModeDecoration() {
  const { preferences, setPreferences } = usePreferences();
  const on = preferences?.testnetMode?.on;
  const checkboxId = useId();
  const { shortcutsDisabled } = useStore(testnetModeStore);

  useBodyStyle(
    useMemo(
      () => ({ ['--technical-panel-bottom-height' as string]: '40px' }),
      []
    )
  );

  const isDialog = urlContext.windowType === 'dialog';
  const shouldRenderSomething = !isDialog || on;
  useBodyStyle(
    useMemo(
      () => (shouldRenderSomething ? { paddingBottom: '36px' } : {}),
      [shouldRenderSomething]
    )
  );
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);
  if (!shouldRenderSomething) {
    return null;
  }
  return (
    <>
      {preferences?.testnetMode && !shortcutsDisabled && !isDialog ? (
        <KeyboardShortcut
          combination="t"
          onKeyDown={() => {
            setPreferences({
              testnetMode: { on: !preferences.testnetMode?.on },
            });
          }}
        />
      ) : null}
      <div
        style={{
          pointerEvents: 'none',
          position: 'fixed',
          width: 'var(--body-width)',
          top: 0,
          bottom: 0,
          zIndex: 'var(--over-layout-index)',
          display: 'grid',
          alignItems: 'end',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderImage:
              'linear-gradient(45deg, cyan, #003aff, #ff00e4, #00ffbc)',
            borderImageSlice: 1,
            borderWidth: on ? 4 : 0,
            borderBottomWidth: on ? 2 : 0,
            borderStyle: 'solid',
          }}
        />
        <div
          style={{
            pointerEvents: 'auto',
            backgroundColor: on ? 'var(--primary-200)' : 'var(--neutral-100)',
            padding: 4,
            border: '2px solid var(--neutral-300)',
            borderImage: on
              ? 'linear-gradient(45deg, cyan, #003aff, #ff00e4, #00ffbc)'
              : undefined,
            borderImageSlice: on ? 1 : undefined,
          }}
        >
          <ZStack>
            <HStack gap={8} style={{ placeSelf: 'center' }}>
              <UIText
                kind="small/accent"
                color="var(--primary)"
                as="label"
                htmlFor={checkboxId}
              >
                {!isDialog ? 'Testnet Mode' : 'Testnets'}
              </UIText>
              {!isDialog ? (
                <Toggle
                  id={checkboxId}
                  checked={Boolean(on)}
                  onChange={(event) => {
                    setPreferences({
                      testnetMode: { on: event.currentTarget.checked },
                    });
                  }}
                />
              ) : null}
            </HStack>
            {!isDialog ? (
              <UnstyledButton
                style={{ placeSelf: 'end' }}
                title="What is Testnet Mode?"
                onClick={() => {
                  dialogRef.current?.showModal();
                }}
              >
                <QuestionHintIcon style={{ color: 'var(--neutral-800)' }} />
              </UnstyledButton>
            ) : null}
            <BottomSheetDialog
              ref={dialogRef}
              style={{ height: 'min-content' }}
            >
              <DialogTitle
                alignTitle="start"
                title={<UIText kind="headline/h3">Testnet Mode</UIText>}
                closeKind="icon"
              />
              <Spacer height={16} />
              <UIText kind="small/regular">
                Testnet Mode allows you to access test networks. To disable the
                Testnet Mode switch, go to{' '}
                <TextLink
                  to="/settings/developer-tools"
                  style={{ color: 'var(--primary)' }}
                  onClick={() => {
                    dialogRef.current?.close();
                  }}
                >
                  Settings → Developer Tools
                </TextLink>
                , or{' '}
                <UnstyledButton
                  className="hover:underline"
                  style={{ color: 'var(--primary)' }}
                  onClick={() => {
                    setPreferences({ testnetMode: null });
                  }}
                >
                  Disable it now completely.
                </UnstyledButton>
              </UIText>
            </BottomSheetDialog>
          </ZStack>
        </div>
      </div>
    </>
  );
}
