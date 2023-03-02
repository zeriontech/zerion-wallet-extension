import React, { useCallback, useId, useState } from 'react';
import { PASSWORD_MIN_LENGTH } from 'src/shared/validation/user-input';
import { StrengthIndicator } from 'src/ui/pages/CreateAccount/StrengthIndicator';
import { AnimatedCheckmark } from 'src/ui/ui-kit/AnimatedCheckmark';
import { Button } from 'src/ui/ui-kit/Button';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { ZStack } from 'src/ui/ui-kit/ZStack';
import { Input } from './Input';

export function Password({ onSubmit }: { onSubmit(key: string): void }) {
  const inputId = useId();
  const [value, setValue] = useState('');
  const [repeatValue, setRepeatValue] = useState('');
  const [focusedInput, setFocusedInput] = useState<
    'password' | 'confirmPassword'
  >('password');
  const [formError, setFormError] = useState<null | {
    type: string;
    message: string;
  }>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const password = new FormData(e.currentTarget).get('password') as
        | string
        | undefined;
      const repeatedPassword = new FormData(e.currentTarget).get(
        'confirmPassword'
      ) as string | undefined;
      if (!password) {
        return;
      }
      if (repeatedPassword !== password) {
        setFormError({
          type: 'confirmPassword',
          message: "Passwords don't match",
        });
        return;
      }
      onSubmit(password);
    },
    [onSubmit]
  );

  return (
    <VStack gap={24}>
      <VStack gap={8}>
        <UIText kind="headline/h2">Finally, create your password</UIText>
        <UIText kind="body/regular">
          This password will unlock Zerion wallet in your browser.
        </UIText>
      </VStack>
      <form onSubmit={handleSubmit}>
        <VStack gap={32}>
          <VStack gap={24}>
            <ZStack>
              <Input
                id={inputId}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                onFocus={() => setFocusedInput('password')}
                autoFocus={true}
                minLength={PASSWORD_MIN_LENGTH}
                type="password"
                name="password"
                placeholder="at least 6 characters"
                required={true}
              />
              <div
                style={{
                  alignSelf: 'center',
                  justifySelf: 'end',
                  marginRight: 12,
                  display: 'flex',
                  justifyContent: 'center',
                  minWidth: 24,
                }}
              >
                {(focusedInput === 'password' && value !== repeatValue) ||
                !value ? (
                  <StrengthIndicator value={value} />
                ) : (
                  <AnimatedCheckmark
                    checked={value === repeatValue}
                    checkedColor="var(--positive-500)"
                    animate={false}
                  />
                )}
              </div>
            </ZStack>
            <VStack gap={4}>
              <ZStack>
                <Input
                  value={repeatValue}
                  onChange={(event) => setRepeatValue(event.target.value)}
                  onFocus={() => setFocusedInput('confirmPassword')}
                  type="password"
                  name="confirmPassword"
                  placeholder="enter the password again"
                  required={true}
                />
                <div
                  style={{
                    alignSelf: 'center',
                    justifySelf: 'end',
                    marginRight: 12,
                    display: 'flex',
                    justifyContent: 'center',
                    minWidth: 24,
                  }}
                >
                  {value &&
                  (focusedInput === 'confirmPassword' ||
                    value === repeatValue) ? (
                    <AnimatedCheckmark
                      animate={focusedInput === 'confirmPassword'}
                      checked={value === repeatValue}
                      checkedColor="var(--positive-500)"
                    />
                  ) : null}
                </div>
              </ZStack>
              {formError?.type === 'confirmPassword' ? (
                <UIText kind="caption/reg" color="var(--negative-500)">
                  {formError.message}
                </UIText>
              ) : null}
            </VStack>
          </VStack>
          <Button kind="primary" style={{ width: '100%' }}>
            Confirm
          </Button>
        </VStack>
      </form>
    </VStack>
  );
}
