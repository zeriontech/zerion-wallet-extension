import React, { useEffect, useId, useState } from 'react';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Input } from 'src/ui/ui-kit/Input';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import VisibleIcon from 'jsx:src/ui/assets/visible.svg';
import InvisibleIcon from 'jsx:src/ui/assets/invisible.svg';
import { Surface } from 'src/ui/ui-kit/Surface';
import { clipboardWarning } from 'src/ui/pages/BackupWallet/clipboardWarning';

export const SecretInput = React.forwardRef(
  (
    {
      label,
      hint,
      showRevealElement,
      onChange,
      id: idFromProps,
      ...inputProps
    }: {
      label: React.ReactNode | null;
      hint: React.ReactNode | null;
      showRevealElement: boolean;
    } & React.InputHTMLAttributes<HTMLInputElement>,
    ref: React.Ref<HTMLInputElement>
  ) => {
    const [inputValue, setInputValue] = useState('');
    const [didRevealOnce, setDidRevealOnce] = useState(false);
    const [reveal, setReveal] = useState(false);
    const toggleReveal = () => {
      setDidRevealOnce(true);
      setReveal((x) => !x);
    };
    useEffect(() => {
      // TODO: Maybe also listen to "paste" event?
      // E.g. when user pastes, also toggle visibility
      if (!inputValue) {
        setReveal(false);
      }
    }, [inputValue]);
    const reactId = useId();
    const id = idFromProps || reactId;
    const isTechnicalHint = clipboardWarning.isWarningMessage(inputValue);
    return (
      <VStack gap={24}>
        <VStack gap={4}>
          {label ? <label htmlFor={id}>{label}</label> : null}
          <HStack gap={4} style={{ gridTemplateColumns: '1fr min-content' }}>
            {showRevealElement ? (
              <Button
                type="button"
                kind="ghost"
                size={46}
                title="Reveal input"
                onClick={() => toggleReveal()}
                style={{
                  /**
                   * NOTE:
                   * We're placing this element visually AFTER the input,
                   * but structurally BEFORE.
                   * Motivation:
                   * Visually, we have a form with an input on top and a button on bottom.
                   * Typical pattern for keyboard users, when they are focused in the input,
                   * is to press "tab" to move focus from the input to the submit button,
                   * and then immediatelly press "enter" to submit the form.
                   * But in our case, the next focusable button after the input
                   * is the "reveal secret value" button, so the user might
                   * press the "tab + enter" combination and accidentally reveal the
                   * sensitive value.
                   * To help avoid this, we're placing the "reveal" button before input,
                   * so that the next focusable element after the input is the submit button
                   */
                  order: 1,
                }}
              >
                {reveal ? (
                  <VisibleIcon
                    style={{ display: 'block', color: 'var(--neutral-500)' }}
                  />
                ) : (
                  <InvisibleIcon
                    style={{ display: 'block', color: 'var(--neutral-500)' }}
                  />
                )}
              </Button>
            ) : null}
            <Input
              id={id}
              ref={ref}
              name="seedOrPrivateKey"
              required={true}
              onChange={(event) => {
                setInputValue(event.target.value);
                onChange?.(event);
              }}
              type={isTechnicalHint ? 'text' : 'password'}
              placeholder="Recovery phrase or a private key"
              {...inputProps}
            />
          </HStack>
          {isTechnicalHint ? (
            <UIText kind="caption/regular" color="var(--notice-500)">
              We cleared your clipboard after you copied the recovery phrase. If
              you saved it somewhere, you can copy and paste it here now.
            </UIText>
          ) : null}
          {hint}
        </VStack>
        {didRevealOnce && inputValue ? (
          <Surface
            padding={12}
            style={{ backgroundColor: 'var(--neutral-200)' }}
          >
            <UIText
              kind="body/regular"
              style={{
                filter: reveal ? undefined : 'blur(5px)',
                transition: 'filter 200ms',
                userSelect: 'none',
                wordBreak: 'break-word',
              }}
            >
              {inputValue}
            </UIText>
          </Surface>
        ) : null}
      </VStack>
    );
  }
);
