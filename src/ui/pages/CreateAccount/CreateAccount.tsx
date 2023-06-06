import React, { useId, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PASSWORD_MIN_LENGTH } from 'src/shared/validation/user-input';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageHeading } from 'src/ui/components/PageHeading';
import { PageTop } from 'src/ui/components/PageTop';
import { Background } from 'src/ui/components/Background';
import { accountPublicRPCPort } from 'src/ui/shared/channels';
import { Button } from 'src/ui/ui-kit/Button';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { AnimatedCheckmark } from 'src/ui/ui-kit/AnimatedCheckmark';
import { ZStack } from 'src/ui/ui-kit/ZStack';
import { Input } from 'src/ui/ui-kit/Input';
import { zeroizeAfterSubmission } from 'src/ui/shared/zeroize-submission';
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
  const createUserMutation = useMutation({
    mutationFn: ({ password }: { password: string }) => {
      return accountPublicRPCPort.request('createUser', { password });
    },
    onSuccess() {
      zeroizeAfterSubmission();
      navigate(params.get('next') || '/get-started');
    },
  });
  return (
    <Background backgroundKind="white">
      <PageColumn>
        <PageTop />
        <NavigationTitle title={null} documentTitle="Create Account" />
        <PageHeading>Create Password</PageHeading>
        <UIText kind="body/regular" color="var(--neutral-500)">
          Protect your wallet by setting a password
        </UIText>
        <Spacer height={24} />
        <form
          style={{ display: 'flex', flexGrow: 1, flexDirection: 'column' }}
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
          <VStack gap={24}>
            <VStack gap={4}>
              <UIText kind="small/accent" color="var(--black)">
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
                  (value?.length || 0) < PASSWORD_MIN_LENGTH ? (
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
                <UIText kind="caption/regular" color="var(--negative-500)">
                  {(createUserMutation.error as Error).message ||
                    'unknown error'}
                </UIText>
              ) : null}
            </VStack>
            <VStack gap={4}>
              <UIText kind="small/accent" color="var(--black)">
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
                  {(value?.length || 0) >= PASSWORD_MIN_LENGTH &&
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
                <UIText kind="caption/regular" color="var(--negative-500)">
                  {formError.message}
                </UIText>
              ) : null}
            </VStack>
          </VStack>
          <VStack gap={16} style={{ marginTop: 'auto' }}>
            <Button>Confirm</Button>
          </VStack>
        </form>
        <PageBottom />
      </PageColumn>
    </Background>
  );
}
