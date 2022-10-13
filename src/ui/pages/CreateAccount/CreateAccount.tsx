import React, { useId, useState } from 'react';
import { useMutation } from 'react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PASSWORD_MIN_LENGTH } from 'src/shared/validation/user-input';
import { Background } from 'src/ui/components/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageHeading } from 'src/ui/components/PageHeading';
import { PageTop } from 'src/ui/components/PageTop';
import { accountPublicRPCPort } from 'src/ui/shared/channels';
import { Button } from 'src/ui/ui-kit/Button';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { AnimatedCheckmark } from 'src/ui/ui-kit/AnimatedCheckmark';
import { ZStack } from 'src/ui/ui-kit/ZStack';
import { Input } from 'src/ui/ui-kit/Input';
import { StrengthIndicator } from './StrengthIndicator';

export function CreateAccount() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
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
  const createUserMutation = useMutation(
    ({ password }: { password: string }) => {
      return accountPublicRPCPort.request('createUser', { password });
    },
    {
      onSuccess() {
        navigate(params.get('next') || '/get-started');
      },
    }
  );
  return (
    <Background backgroundKind="white">
      <PageColumn>
        <PageTop />
        <NavigationTitle title={null} />
        <PageHeading>Create Password</PageHeading>
        <UIText kind="subtitle/s_reg" color="var(--neutral-500)">
          Protect your wallet by setting a password
        </UIText>
        <Spacer height={24} />
        <form
          onChange={() => setFormError(null)}
          onSubmit={(event) => {
            event.preventDefault();
            const password = new FormData(event.currentTarget).get(
              'password'
            ) as string | undefined;
            const repeatedPassword = new FormData(event.currentTarget).get(
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
            createUserMutation.mutate({ password });
          }}
        >
          <VStack gap={16}>
            <VStack gap={4}>
              <UIText kind="subtitle/s_reg" color="var(--neutral-500)">
                Password
              </UIText>
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
                  placeholder="password"
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
              {createUserMutation.error ? (
                <UIText kind="caption/reg" color="var(--negative-500)">
                  {(createUserMutation.error as Error).message ||
                    'unknown error'}
                </UIText>
              ) : null}
            </VStack>
            <VStack gap={4}>
              <UIText kind="subtitle/s_reg" color="var(--neutral-500)">
                Confirm Password
              </UIText>
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
            <Button>Confirm</Button>
          </VStack>
        </form>
        <PageBottom />
      </PageColumn>
    </Background>
  );
}
