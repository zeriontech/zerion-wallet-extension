import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VStack } from 'src/ui/ui-kit/VStack';
import { PrivacyFooter } from 'src/ui/components/PrivacyFooter';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import ArrowLeftIcon from 'jsx:src/ui/assets/arrow-left.svg';
import { zeroizeAfterSubmission } from 'src/ui/shared/zeroize-submission';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { Input } from 'src/ui/ui-kit/Input';
import { useSizeStore } from '../useSizeStore';
import { useMnemonicInput } from '../shared/useMnemonicInput';
import * as helperStyles from '../shared/helperStyles.module.css';
import { isSessionExpiredError } from '../shared/isSessionExpiredError';
import { usePendingRecoveryPhrase } from '../shared/usePendingRecoveryPhrase';

const INPUT_NUMBER = 12;
const ARRAY_OF_NUMBERS = Array.from({ length: INPUT_NUMBER }, (_, i) => i);

export function VerifyBackup({ onSuccess }: { onSuccess(): void }) {
  const navigate = useNavigate();
  const { isNarrowView } = useSizeStore();
  const [value, setValue] = useState(() => ARRAY_OF_NUMBERS.map(() => ''));
  const [validationError, setValidationError] = useState(false);

  const { getInputProps } = useMnemonicInput({
    setValue,
    maxInputNumber: INPUT_NUMBER,
  });

  const { data: mnemonic, isLoading, error } = usePendingRecoveryPhrase();

  useEffect(() => {
    if (isSessionExpiredError(error)) {
      navigate('/onboarding/session-expired', { replace: true });
    }
  }, [navigate, error]);

  const handleVerify = useCallback(() => {
    setValidationError(false);
    if (mnemonic === value.join(' ')) {
      zeroizeAfterSubmission();
      onSuccess();
    } else {
      setValidationError(true);
    }
  }, [mnemonic, value, onSuccess]);

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

  return (
    <VStack gap={isNarrowView ? 16 : 56}>
      <div
        className={helperStyles.container}
        style={{ justifyContent: 'center', paddingBlock: 60 }}
      >
        <UnstyledButton
          aria-label="Exit creating wallet"
          className={helperStyles.backButton}
          onClick={() => navigate(-1)}
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
              This process is aimed to ensure you’ve saved your recovery phrase
              correctly
            </UIText>
          </VStack>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify();
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
                      style={{ width: '100%', paddingLeft: 32 }}
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
              ) : null}
            </VStack>
          </form>
        </VStack>
      </div>
      <PrivacyFooter />
    </VStack>
  );
}
