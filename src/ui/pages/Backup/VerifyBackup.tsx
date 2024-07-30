import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { VStack } from 'src/ui/ui-kit/VStack';
import { PrivacyFooter } from 'src/ui/components/PrivacyFooter';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import ArrowLeftIcon from 'jsx:src/ui/assets/arrow-left.svg';
import { zeroizeAfterSubmission } from 'src/ui/shared/zeroize-submission';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { Input } from 'src/ui/ui-kit/Input';
import { isSessionExpiredError } from 'src/ui/shared/isSessionExpiredError';
import { useWindowSizeStore } from 'src/ui/shared/useWindowSizeStore';
import { useMnemonicInput } from 'src/ui/shared/useMnemonicInput';
import * as helperStyles from 'src/ui/features/onboarding/shared/helperStyles.module.css';
import { invariant } from 'src/shared/invariant';
import { useGoBack } from 'src/ui/shared/navigation/useGoBack';
import {
  usePendingRecoveryPhrase,
  useRecoveryPhrase,
} from './useRecoveryPhrase';
import { clipboardWarning } from './clipboardWarning';

const INPUT_NUMBER = 12;
const ARRAY_OF_NUMBERS = Array.from({ length: INPUT_NUMBER }, (_, i) => i);

export function VerifyBackup({
  groupId,
  onSessionExpired,
  onSuccess,
}: {
  groupId: string | null;
  onSessionExpired(): void;
  onSuccess(): void;
}) {
  const { isNarrowView } = useWindowSizeStore();
  const [value, setValue] = useState(() => ARRAY_OF_NUMBERS.map(() => ''));
  const [validationError, setValidationError] = useState(false);
  const isTechnicalHint = clipboardWarning.isWarningMessage(value.join(' '));

  const { getInputProps } = useMnemonicInput({
    setValue,
    maxInputNumber: INPUT_NUMBER,
    type: isTechnicalHint ? 'text' : undefined,
  });

  const isPendingWallet = !groupId;
  const existingRecoveryPhraseQuery = useRecoveryPhrase({
    groupId,
    enabled: !isPendingWallet,
  });
  const pendingRecoveryPhraseQuery = usePendingRecoveryPhrase({
    enabled: isPendingWallet,
  });

  const {
    data: recoveryPhrase,
    isLoading,
    isError,
    error,
  } = isPendingWallet
    ? pendingRecoveryPhraseQuery
    : existingRecoveryPhraseQuery;

  useEffect(() => {
    if (isError && isSessionExpiredError(error)) {
      onSessionExpired();
    }
  }, [isError, error, onSessionExpired]);

  const verifyRecoveryPhrase = useCallback(
    (value: string) => {
      invariant(recoveryPhrase, 'recoveryPhrase is missing');
      setValidationError(false);
      if (recoveryPhrase.toLowerCase() === value.toLowerCase()) {
        zeroizeAfterSubmission();
        onSuccess();
      } else {
        setValidationError(true);
      }
    },
    [recoveryPhrase, onSuccess]
  );

  const errorStyle = useMemo<React.CSSProperties>(
    () =>
      isNarrowView
        ? {
            position: 'absolute',
            bottom: 48,
            left: 0,
            right: 0,
            textAlign: 'center',
          }
        : { position: 'absolute', bottom: -24 },
    [isNarrowView]
  );

  const goBack = useGoBack();

  return (
    <VStack gap={isNarrowView ? 16 : 56}>
      <div
        className={helperStyles.container}
        style={{ justifyContent: 'center', paddingBlock: 60 }}
      >
        <UnstyledButton
          aria-label="Exit creating wallet"
          className={helperStyles.backButton}
          onClick={goBack}
        >
          <ArrowLeftIcon style={{ width: 20, height: 20 }} />
        </UnstyledButton>
        <VStack gap={40} style={{ maxWidth: 340 }}>
          <VStack gap={8}>
            <UIText kind="headline/h2">
              To Continue,
              <br />
              Verify Your Recovery Phrase
            </UIText>
            <UIText kind="body/regular">
              This step ensures you’ve saved your recovery phrase correctly
            </UIText>
          </VStack>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              verifyRecoveryPhrase(value.join(' '));
            }}
          >
            <VStack gap={40} style={{ position: 'relative' }}>
              <div className={helperStyles.phraseInputGrip}>
                {ARRAY_OF_NUMBERS.map((index) => (
                  <div key={index} style={{ position: 'relative' }}>
                    <Input
                      {...getInputProps(index)}
                      id={`word-${index}`}
                      name={`word-${index}`}
                      style={{ width: '100%', paddingLeft: 30 }}
                      value={value[index]}
                    />
                    <UIText
                      kind="body/regular"
                      color="var(--neutral-600)"
                      style={{
                        position: 'absolute',
                        left: 12,
                        top: 10,
                        userSelect: 'none',
                      }}
                    >
                      {index + 1}.
                    </UIText>
                  </div>
                ))}
              </div>
              <Button
                kind="primary"
                style={{ width: '100%' }}
                disabled={isLoading}
              >
                Verify
              </Button>
              {validationError ? (
                <UIText
                  kind="caption/regular"
                  color="var(--negative-500)"
                  style={errorStyle}
                >
                  Incorrect seed phrase
                </UIText>
              ) : isTechnicalHint ? (
                <UIText kind="caption/regular" color="var(--notice-500)">
                  Your clipboard was cleared after copying the recovery phrase.
                  If saved, you can now paste it here.
                </UIText>
              ) : null}
            </VStack>
          </form>
        </VStack>
      </div>
      <PrivacyFooter />
    </VStack>
  );
}
