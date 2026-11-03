import React from 'react';
import type {
  NetworkFeeConfiguration,
  NetworkFeeSpeed,
} from 'src/shared/types/TransactionConfiguration';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import * as helperStyles from 'src/ui/style/helpers.module.css';

export function getNetworkFeeReminderLabel(
  speed: NetworkFeeSpeed
): string | null {
  if (speed === 'average') {
    return 'Slow selected';
  }
  if (speed === 'custom') {
    return 'Custom fee selected';
  }
  return null;
}

/**
 * Preference hint under the Network Fee row. It is deliberately grey: a
 * non-Fast level is a choice, not a warning. Switching back to Fast goes
 * through the same callback as the picker, so the preset is persisted.
 */
export function NetworkFeeReminder({
  networkFee,
  onChange,
}: {
  networkFee: NetworkFeeConfiguration;
  onChange?: (value: NetworkFeeConfiguration) => void;
}) {
  const label = getNetworkFeeReminderLabel(networkFee.speed);
  if (!label) {
    return null;
  }
  return (
    <HStack
      gap={8}
      justifyContent="space-between"
      alignItems="center"
      style={{ width: '100%' }}
    >
      <UIText
        kind="caption/regular"
        color="var(--neutral-500)"
        style={{ whiteSpace: 'nowrap' }}
      >
        {label}
      </UIText>
      {onChange ? (
        <UnstyledButton
          type="button"
          className={helperStyles.hoverUnderline}
          onClick={() =>
            onChange({
              ...networkFee,
              speed: 'fast',
              gasLimit: null,
            })
          }
        >
          <UIText
            kind="caption/accent"
            color="var(--primary)"
            style={{ whiteSpace: 'nowrap' }}
          >
            Switch to Fast
          </UIText>
        </UnstyledButton>
      ) : null}
    </HStack>
  );
}
