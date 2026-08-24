import React, { useId, useState } from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { DebouncedInput } from 'src/ui/ui-kit/Input/DebouncedInput';
import * as styles from './CustomDataField.module.css';

/**
 * Custom transaction data as a standing field in its own floating frame below
 * the asset fieldset, rendered whenever the Developer Tools "Custom Data"
 * preference is on (EVM senders, token mode). It used to live as a row inside
 * the collapsed Details card behind a dialog; the send flows that need it
 * (calldata claims, approvals, non-payable calls) treat it as a primary input,
 * so it's edited inline here instead.
 *
 * The value is stored raw, exactly as typed, and hexlified at the backend
 * boundary. Typing is debounced because every change re-prepares the send.
 */
export function CustomDataField({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (value: string | undefined) => void;
}) {
  const inputId = useId();
  // Clearing has to discard whatever is still sitting in the debounce, not just
  // the committed value — otherwise a queued keystroke fires after the clear and
  // puts the old text back. Remounting the debounced input cancels the pending
  // call and reseeds it from the (now empty) form state.
  const [inputKey, setInputKey] = useState(0);

  return (
    <div className={styles.frame}>
      <VStack gap={8}>
        <HStack gap={16} justifyContent="space-between" alignItems="center">
          <UIText kind="small/regular" as="label" htmlFor={inputId}>
            Data
          </UIText>
          {value ? (
            <UnstyledButton
              type="button"
              onClick={() => {
                onChange(undefined);
                setInputKey((key) => key + 1);
              }}
            >
              <UIText kind="small/regular" color="var(--primary)">
                Clear
              </UIText>
            </UnstyledButton>
          ) : null}
        </HStack>
        <DebouncedInput
          key={inputKey}
          delay={300}
          value={value ?? ''}
          onChange={(next) => onChange(next ? next : undefined)}
          render={({ value: draft, handleChange }) => (
            <textarea
              id={inputId}
              name="data"
              value={draft}
              onChange={(event) => handleChange(event.currentTarget.value)}
              className={styles.input}
              rows={2}
              placeholder="0x..."
              spellCheck={false}
              autoComplete="off"
            />
          )}
        />
      </VStack>
    </div>
  );
}
