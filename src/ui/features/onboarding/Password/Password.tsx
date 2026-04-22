import React, { useId, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Content } from 'react-area';
import { PASSWORD_MIN_LENGTH } from 'src/shared/validation/user-input';
import { StrengthIndicator } from 'src/ui/pages/CreateAccount/StrengthIndicator';
import { Button } from 'src/ui/ui-kit/Button';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import ArrowRightIcon from 'jsx:src/ui/assets/arrow-right.svg';
import { invariant } from 'src/shared/invariant';
import type { StrengthStats } from 'src/shared/validation/password-strength';
import {
  Strength,
  estimatePasswordStrengh,
} from 'src/shared/validation/password-strength';
import { WarningIcon } from 'src/ui/components/WarningIcon';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Input } from 'src/ui/ui-kit/Input';
import { focusNode } from 'src/ui/shared/focusNode';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { StrengthChecks } from 'src/ui/pages/CreateAccount/StrengthChecks';
import { CheckmarkBadge } from 'src/ui/pages/CreateAccount/StrengthChecks/StrengthChecks';
import { useGoBack } from 'src/ui/shared/navigation/useGoBack';
import { isMacOS } from 'src/ui/shared/isMacos';
import { usePasskeyAvailability } from 'src/ui/pages/Security/Security';
import { getPasskeyTitle } from 'src/ui/pages/Security/passkey';
import { ToggleSettingLine } from 'src/ui/pages/Settings/ToggleSettingsLine';
import { Frame } from 'src/ui/ui-kit/Frame';
import { ViewParam } from '../Import/ImportSearchParams';
import { PasswordFAQ } from '../FAQ';
import { PasswordStep } from './passwordSearchParams';

const macOsDetected = isMacOS();

function WeakPasswordWarning() {
  const goBack = useGoBack();
  return (
    <VStack gap={24}>
      <VStack gap={8}>
        <WarningIcon
          size={40}
          outlineStrokeWidth={6}
          borderWidth="3px"
          glow={true}
        />
        <UIText kind="headline/h2">Weak Password</UIText>
        <UIText kind="body/regular">
          Your current password choice seems weak.
          <br />
          For better security, we recommend the following:
        </UIText>
        <UIText kind="body/regular">
          <ul
            style={{
              padding: 0,
              margin: 0,
              listStylePosition: 'inside',
              listStyleType: "'– '",
            }}
          >
            <li>Minimum of 14 characters</li>
            <li>A mix of uppercase and lowercase letters</li>
            <li>Include numbers and symbols</li>
            <li>Avoid commonly used passwords</li>
          </ul>
        </UIText>
      </VStack>
      <HStack gap={16} style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Button
          kind="regular"
          as={UnstyledLink}
          to={`?view=${ViewParam.password}&step=${PasswordStep.confirm}`}
        >
          Proceed Anyway
        </Button>
        <Button
          ref={focusNode}
          kind="primary"
          as={UnstyledLink}
          onClick={(event) => {
            event.preventDefault();
            goBack();
          }}
          to={`?view=${ViewParam.password}&step=${PasswordStep.create}`}
          style={{ paddingInline: 20 }}
        >
          Improve Password
        </Button>
      </HStack>
    </VStack>
  );
}

function CreatePasswordForm({
  defaultValue,
  onSubmit,
}: {
  defaultValue: string;
  onSubmit: (result: { value: string; stats: StrengthStats }) => void;
}) {
  const inputId = useId();
  const [value, setValue] = useState(defaultValue);
  const stats = useMemo(() => estimatePasswordStrengh(value), [value]);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (!form.checkValidity()) {
          return;
        }
        onSubmit({ value, stats });
      }}
    >
      <VStack gap={32}>
        <VStack gap={24}>
          <VStack gap={8}>
            <Input
              id={inputId}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              autoFocus={true}
              minLength={PASSWORD_MIN_LENGTH}
              type="password"
              name="password"
              placeholder="at least 6 characters"
              required={true}
            />
            <StrengthIndicator stats={stats} />
          </VStack>
          <StrengthChecks stats={stats} />
        </VStack>
        <Button kind="primary" style={{ width: '100%' }}>
          <HStack gap={8} alignItems="center" justifyContent="center">
            <span>Confirm Password</span>
            <ArrowRightIcon style={{ width: 24, height: 24 }} />
          </HStack>
        </Button>
      </VStack>
    </form>
  );
}

function ConfirmPasswordForm({
  password,
  onSubmit,
}: {
  password: string;
  onSubmit: ({ passkey }: { passkey?: boolean }) => void;
}) {
  invariant(Boolean(password), 'Password must be a non-empty string');
  const [value, setValue] = useState('');
  const [passkeyEnabled, setPasskeyEnabled] = useState(false);
  const [formError, setFormError] = useState<null | {
    type: string;
    message: string;
  }>(null);
  const passkeyAvailabilityQuery = usePasskeyAvailability();
  const passkeyTitle = getPasskeyTitle();

  return (
    <form
      onChange={() => setFormError(null)}
      onSubmit={(event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const repeatedPassword = formData.get('confirmPassword') as
          | string
          | undefined;
        if (!password) {
          return;
        }
        // eslint-disable-next-line security/detect-possible-timing-attacks -- Locally known values are compared, so a timing attack does not make sense
        if (repeatedPassword !== password) {
          setFormError({
            type: 'confirmPassword',
            message: "Passwords don't match",
          });
          return;
        }
        onSubmit({ passkey: passkeyEnabled });
      }}
    >
      <VStack gap={24}>
        <VStack gap={4}>
          <Input
            onChange={(event) => setValue(event.target.value)}
            autoFocus={true}
            minLength={PASSWORD_MIN_LENGTH}
            type="password"
            name="confirmPassword"
            placeholder="re-enter password"
            required={true}
          />
          {formError ? (
            <UIText kind="caption/regular" color="var(--negative-500)">
              {formError.message}
            </UIText>
          ) : null}
        </VStack>
        <div style={{ display: 'flex' }}>
          <CheckmarkBadge
            text="Passwords match"
            positive={value === password}
          />
        </div>
      </VStack>
      {passkeyAvailabilityQuery.data ? (
        <div style={{ position: 'relative' }}>
          <Spacer height={24} />
          <Frame>
            <ToggleSettingLine
              text={`Unlock with ${passkeyTitle}`}
              checked={passkeyEnabled}
              onChange={(event) => setPasskeyEnabled(event.target.checked)}
              detailText={`Use biometrics (${passkeyTitle}) to securely sign in without typing in your password`}
            />
          </Frame>
          {!macOsDetected ? (
            <div
              style={{
                position: 'absolute',
                top: 16,
                right: -8,
                borderRadius: 8,
                backgroundColor: 'var(--primary)',
                padding: '2px 8px',
              }}
            >
              <UIText kind="caption/accent" color="var(--always-white)">
                Beta
              </UIText>
            </div>
          ) : null}
        </div>
      ) : null}
      <Spacer height={24} />
      <Button
        kind="primary"
        style={{ width: '100%', paddingInline: 12 }}
        type="submit"
      >
        Set Password
      </Button>
    </form>
  );
}

export function Password({
  title,
  step,
  defaultValue,
  onSubmit,
}: {
  title: string;
  step: PasswordStep | null;
  defaultValue: string | null;
  onSubmit(value: string, passkey?: boolean): void;
}) {
  const navigate = useNavigate();
  const [value, setValue] = useState(defaultValue || '');

  return (
    <>
      {' '}
      {step === PasswordStep.warning ? (
        <WeakPasswordWarning />
      ) : (
        <VStack gap={24} style={{ alignItems: 'start' }}>
          <VStack gap={8}>
            <UIText kind="headline/h2">
              {step === PasswordStep.confirm ? 'Confirm password' : title}
            </UIText>
            <UIText kind="body/regular">
              This password will unlock Zerion wallet in your browser.
            </UIText>
          </VStack>
          {step === PasswordStep.create ? (
            <CreatePasswordForm
              defaultValue={value}
              onSubmit={({ value, stats }) => {
                setValue(value);
                if (stats.strength === Strength.weak) {
                  navigate(
                    `?view=${ViewParam.password}&step=${PasswordStep.warning}`
                  );
                } else {
                  navigate(
                    `?view=${ViewParam.password}&step=${PasswordStep.confirm}`
                  );
                }
              }}
            />
          ) : step === PasswordStep.confirm ? (
            <ConfirmPasswordForm
              password={value}
              onSubmit={({ passkey }) => {
                onSubmit(value, passkey);
              }}
            />
          ) : null}
        </VStack>
      )}
      <Content name="onboarding-faq">
        <PasswordFAQ />
      </Content>
    </>
  );
}
