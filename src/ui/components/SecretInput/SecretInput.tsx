import React, { useEffect, useId, useState } from 'react';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Input } from 'src/ui/ui-kit/Input';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import VisibleIcon from 'jsx:src/ui/assets/visible.svg';
import InvisibleIcon from 'jsx:src/ui/assets/invisible.svg';
import { Surface } from 'src/ui/ui-kit/Surface';

export const SecretInput = React.forwardRef(
  (
    {
      label,
      hint,
      onChange,
      id: idFromProps,
      ...inputProps
    }: {
      label: React.ReactNode | null;
      hint: React.ReactNode | null;
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
    return (
      <VStack gap={24}>
        <VStack gap={4}>
          {label ? <label htmlFor={id}>{label}</label> : null}
          <HStack gap={4} style={{ gridTemplateColumns: '1fr min-content' }}>
            <Input
              id={id}
              ref={ref}
              name="seedOrPrivateKey"
              required={true}
              onChange={(event) => {
                setInputValue(event.target.value);
                onChange?.(event);
              }}
              type="password"
              placeholder="Recovery phrase or a private key"
              {...inputProps}
            />
            <Button
              type="button"
              kind="ghost"
              size={46}
              title="Reveal input"
              onClick={() => toggleReveal()}
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
          </HStack>
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
                userSelect: 'none',
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
