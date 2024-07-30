import React, { useCallback, useMemo, useState } from 'react';
import { animated, useSpring } from '@react-spring/web';
import { Content } from 'react-area';
import { validate } from 'src/ui/pages/GetStarted/ImportWallet/ImportWallet';
import type { ValidationResult } from 'src/shared/validation/ValidationResult';
import { prepareUserInputSeedOrPrivateKey } from 'src/ui/shared/prepareUserInputSeedOrPrivateKey';
import { Button } from 'src/ui/ui-kit/Button';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { zeroizeAfterSubmission } from 'src/ui/shared/zeroize-submission';
import { Input } from 'src/ui/ui-kit/Input';
import { useWindowSizeStore } from 'src/ui/shared/useWindowSizeStore';
import { useMnemonicInput } from 'src/ui/shared/useMnemonicInput';
import { PhraseFAQ } from '../FAQ';
import * as helpersStyles from '../shared/helperStyles.module.css';
import * as styles from './styles.module.css';

const MAX_INPUT_NUMBER = 24;
const ARRAY_OF_NUMBERS = Array.from({ length: MAX_INPUT_NUMBER }, (_, i) => i);

export function ImportMnemonic({
  onSubmit,
}: {
  onSubmit(mnemonic: string): void;
}) {
  const { isNarrowView } = useWindowSizeStore();
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [phraseMode, setPhraseMode] = useState<12 | 24>(12);
  const [value, setValue] = useState(() => ARRAY_OF_NUMBERS.map(() => ''));

  const { getInputProps } = useMnemonicInput({
    columns: 3,
    rows: phraseMode === 12 ? 4 : 8,
    maxInputNumber: MAX_INPUT_NUMBER,
    setValue,
  });

  const handleSubmit = useCallback(
    (value: string) => {
      setValidation(null);
      const phrase = prepareUserInputSeedOrPrivateKey(value);
      const validity = validate({ recoveryInput: phrase });
      setValidation(validity);
      if (!validity.valid) {
        return;
      }
      zeroizeAfterSubmission();
      setValue(ARRAY_OF_NUMBERS.map(() => ''));
      onSubmit(phrase);
    },
    [onSubmit]
  );

  const gridStyle = useSpring({
    maxHeight: phraseMode === 24 ? 440 : 216,
    height: phraseMode === 24 ? 440 : 216,
  });

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
    <>
      <VStack gap={20}>
        <VStack gap={8}>
          <UIText kind="headline/h2">Recovery phrase</UIText>
          <UIText kind="body/regular">
            Import an existing wallet with your 12 or 24 word recovery phrase.
          </UIText>
        </VStack>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(value.slice(0, phraseMode).join(' '));
          }}
        >
          <VStack gap={28} style={{ position: 'relative' }}>
            <animated.div
              className={helpersStyles.phraseInputGrip}
              style={gridStyle}
            >
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
            </animated.div>
            <UnstyledButton
              type="button"
              onClick={() =>
                setPhraseMode((current) => (current === 12 ? 24 : 12))
              }
              className={styles.modeSelector}
            >
              <UIText kind="caption/accent" color="var(--neutral-600)">
                {`Use ${36 - phraseMode} word phrase`}
              </UIText>
            </UnstyledButton>
            <Button kind="primary" style={{ width: '100%' }}>
              Import wallet
            </Button>
            {!validation || validation.valid ? null : (
              <UIText
                kind="caption/regular"
                color="var(--negative-500)"
                style={errorStyle}
              >
                {validation.message}
              </UIText>
            )}
          </VStack>
        </form>
      </VStack>
      <Content name="onboarding-faq">
        <PhraseFAQ />
      </Content>
    </>
  );
}
