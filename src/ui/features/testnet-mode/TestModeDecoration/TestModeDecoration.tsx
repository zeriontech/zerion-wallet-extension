import { useId, useMemo } from 'react';
import { useStore } from '@store-unit/react';
import { useBodyStyle } from 'src/ui/components/Background/Background';
import { templateData } from 'src/ui/shared/getPageTemplateName';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Toggle } from 'src/ui/ui-kit/Toggle';
import { usePreferences } from '../../preferences';
import { testnetModeStore } from '../store';

export function TestModeDecoration() {
  const { preferences, setPreferences } = usePreferences();
  const on = preferences?.testnetMode?.on;
  const checkboxId = useId();
  const { shortcutsDisabled } = useStore(testnetModeStore);
  const isDialog = templateData.windowContext === 'dialog';

  const shouldRenderSomething = !isDialog || on;
  useBodyStyle(
    useMemo(
      () => (shouldRenderSomething ? { paddingBottom: '36px' } : {}),
      [shouldRenderSomething]
    )
  );
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
            display: 'flex',
            justifyContent: 'center',
            padding: 4,
            border: '2px solid var(--neutral-300)',
            borderImage: on
              ? 'linear-gradient(45deg, cyan, #003aff, #ff00e4, #00ffbc)'
              : undefined,
            borderImageSlice: on ? 1 : undefined,
          }}
        >
          <HStack gap={8}>
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
        </div>
      </div>
    </>
  );
}
