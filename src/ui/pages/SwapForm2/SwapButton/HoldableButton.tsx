import React from 'react';
import cn from 'classnames';
import { HStack } from 'src/ui/ui-kit/HStack';
import { usePreferences } from 'src/ui/features/preferences/usePreferences';
import {
  KeyboardShortcut,
  ShortcutHint,
} from 'src/ui/components/KeyboardShortcut';
import { useWindowFocus } from 'src/ui/shared/useWindowFocus';
import { HoldHint, useHoldToFire } from './SwapButton';
import * as styles from './SwapButton.module.css';

export function HoldableButton({
  label,
  disabled,
  onFire,
  leadingIcon,
  shortcutCombination = 'mod+enter',
  className,
}: {
  label: React.ReactNode;
  disabled: boolean;
  onFire: () => void;
  leadingIcon?: React.ReactNode;
  shortcutCombination?: string;
  className?: string;
}) {
  const { preferences } = usePreferences();
  const holdEnabled = Boolean(preferences?.enableHoldToSignButton);
  const keyboardShortcutEnabled = Boolean(
    preferences?.enableKeyboardShortcutToSign
  );
  const windowFocused = useWindowFocus();
  const shortcutActive = keyboardShortcutEnabled && !disabled;

  const { isHolding, showHoldHint, buttonHandlers } = useHoldToFire({
    onFire,
    holdEnabled,
    disabled,
    shortPressThreshold: 2,
  });

  return (
    <>
      <KeyboardShortcut
        combination={shortcutCombination}
        onKeyDown={() => onFire()}
        disabled={!shortcutActive}
        availableDuringInputs={true}
      />
      <button
        type="button"
        className={cn(styles.button, className)}
        disabled={disabled}
        {...buttonHandlers}
      >
        {holdEnabled ? (
          <div
            className={cn(styles.holdOverlay, {
              [styles.holdOverlayActive]: isHolding,
            })}
          />
        ) : null}
        <span className={styles.label}>
          <HStack gap={8} alignItems="center" justifyContent="center">
            {leadingIcon}
            <span>{label}</span>
            {shortcutActive && windowFocused ? <ShortcutHint /> : null}
          </HStack>
        </span>
      </button>
      {showHoldHint ? <HoldHint /> : null}
    </>
  );
}
