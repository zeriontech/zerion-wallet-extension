import React from 'react';
import CheckIcon from 'jsx:src/ui/assets/checkmark-checked.svg';
import { FIAT_CURRENCIES } from 'src/modules/currency/currencies';
import { Dialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { VStack } from 'src/ui/ui-kit/VStack';
import * as styles from './styles.module.css';

/**
 * A dialog rather than the web app's dropdown popover: 19 options do not fit
 * comfortably in a popover anchored inside a 600px-tall popup, and the
 * extension's other in-form selectors are already dialogs.
 */
export function CurrencySelectDialog({
  open,
  onClose,
  value,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  value: string | undefined;
  onSelect: (code: string) => void;
}) {
  return (
    <Dialog2
      open={open}
      onClose={onClose}
      title="Pay with"
      size="content"
      autoFocusInput={false}
    >
      <VStack gap={0} style={{ paddingBottom: 8 }}>
        {FIAT_CURRENCIES.map((config) => (
          <UnstyledButton
            key={config.code}
            className={styles.optionRow}
            onClick={() => {
              onSelect(config.code);
              onClose();
            }}
          >
            <HStack
              gap={12}
              alignItems="center"
              justifyContent="space-between"
              style={{ width: '100%', gridTemplateColumns: '1fr auto' }}
            >
              <HStack gap={8} alignItems="center">
                <UIText
                  kind="body/accent"
                  color="var(--neutral-500)"
                  style={{ minWidth: 24 }}
                >
                  {config.symbol}
                </UIText>
                <UIText kind="body/accent">{config.code.toUpperCase()}</UIText>
                <UIText kind="body/regular" color="var(--neutral-500)">
                  {config.name}
                </UIText>
              </HStack>
              {config.code === value ? (
                <CheckIcon
                  style={{ width: 20, height: 20, color: 'var(--primary)' }}
                />
              ) : null}
            </HStack>
          </UnstyledButton>
        ))}
      </VStack>
    </Dialog2>
  );
}
