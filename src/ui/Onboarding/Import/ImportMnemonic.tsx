import React, { useCallback, useMemo, useState } from 'react';
import { animated, useSpring } from '@react-spring/web';
import { useMutation } from '@tanstack/react-query';
import produce from 'immer';
import type { BareWallet } from 'src/shared/types/BareWallet';
import { validate } from 'src/ui/pages/GetStarted/ImportWallet/ImportWallet';
import type { ValidationResult } from 'src/shared/validation/ValidationResult';
import { prepareUserInputSeedOrPrivateKey } from 'src/ui/shared/prepareUserInputSeedOrPrivateKey';
import { Button } from 'src/ui/ui-kit/Button';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { getFirstNMnemonicWallets } from 'src/ui/pages/GetStarted/ImportWallet/MnemonicImportView/getFirstNMnemonicWallets';
import { getError } from 'src/shared/errors/getError';
import { useDebouncedCallback } from 'src/ui/shared/useDebouncedCallback';
import { HStack } from 'src/ui/ui-kit/HStack';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { zeroizeAfterSubmission } from 'src/ui/shared/zeroize-submission';
import { useSizeStore } from '../useSizeStore';
import { useWhitelistStatus } from '../checkWhitelistStatus';
import * as styles from './styles.module.css';
import { Input } from './Input';

const INPUT_NUMBER = 24;
const ARRAY_OF_NUMBERS = Array.from({ length: INPUT_NUMBER }, (_, i) => i);

export function ImportMnemonic({
  address,
  onWalletCreate,
}: {
  address: string;
  onWalletCreate(wallet: BareWallet): void;
}) {
  const { isNarrowView } = useSizeStore();
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [phraseMode, setPhraseMode] = useState<12 | 24>(12);
  const [value, setValue] = useState(() => ARRAY_OF_NUMBERS.map(() => ''));
  const [hoveredInput, setHoveredInput] = useState<number | null>(null);
  const [focusedInput, setFocusedInput] = useState<number | null>(null);

  const setHoveredInputDebounced = useDebouncedCallback(setHoveredInput, 150);

  const { data: isWhiteListedResponse, isLoading: isWhitelistStatusLoading } =
    useWhitelistStatus(address);

  const { mutate, isLoading } = useMutation({
    mutationFn: async (value: string) => {
      setValidation(null);
      if (!isWhiteListedResponse?.status) {
        throw new Error("You're not whitelisted");
      }
      const phrase = prepareUserInputSeedOrPrivateKey(value);
      const validity = validate({ recoveryInput: phrase });
      setValidation(validity);
      if (!validity.valid) {
        return;
      }
      const wallets = await getFirstNMnemonicWallets({ phrase, n: 100 });
      const wallet = address
        ? wallets.find(
            (item) =>
              normalizeAddress(item.address) === normalizeAddress(address)
          )
        : null;

      if (address && !wallet) {
        throw new Error("We can't find your wallet by this phrase");
      }
      if (!wallet?.mnemonic) {
        return;
      }
      return wallet;
    },
    onSuccess: (wallet) => {
      if (wallet) {
        setValue(ARRAY_OF_NUMBERS.map(() => ''));
        zeroizeAfterSubmission();
        onWalletCreate(wallet);
      }
    },
    onError: (error) => {
      setValidation({
        valid: false,
        message: getError(error).message,
      });
    },
  });

  const gridStyle = useSpring({
    maxHeight: phraseMode === 24 ? 440 : 216,
    height: phraseMode === 24 ? 440 : 216,
  });

  const handlePaste = useCallback((index: number, value: string) => {
    const splitValue = value.trim().split(/\s+/);
    setValue((current) => {
      return produce(current, (draft) => {
        splitValue.forEach((item, i) => {
          if (i + index >= INPUT_NUMBER) {
            return;
          }
          draft[index + i] = item;
        });
      });
    });
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      if (e.code === 'Space' && index + 1 < phraseMode) {
        e.preventDefault();
        document.getElementById(`word-${index + 1}`)?.focus();
        (
          document.getElementById(`word-${index + 1}`) as HTMLInputElement
        )?.select();
      }
      if (e.code === 'Backspace' && !e.currentTarget.value?.length) {
        e.preventDefault();
        document.getElementById(`word-${index - 1}`)?.focus();
      }
      if (e.code === 'ArrowLeft' && e.currentTarget.selectionStart === 0) {
        e.preventDefault();
        document.getElementById(`word-${index - 1}`)?.focus();
      }
      if (
        e.code === 'ArrowRight' &&
        index + 1 < phraseMode &&
        (e.currentTarget.selectionStart || 0) >=
          (e.currentTarget.value?.length || 0)
      ) {
        e.preventDefault();
        document.getElementById(`word-${index + 1}`)?.focus();
        (
          document.getElementById(`word-${index + 1}`) as HTMLInputElement
        )?.setSelectionRange(0, 0);
      }
      if (e.code === 'ArrowUp') {
        e.preventDefault();
        document.getElementById(`word-${index - 3}`)?.focus();
      }
      if (e.code === 'ArrowDown' && index + 3 < phraseMode) {
        e.preventDefault();
        document.getElementById(`word-${index + 3}`)?.focus();
      }
    },
    [phraseMode]
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

  return (
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
          mutate(value.slice(0, phraseMode).join(' '));
        }}
      >
        <VStack gap={28} style={{ position: 'relative' }}>
          <animated.div className={styles.phraseInputGrip} style={gridStyle}>
            {ARRAY_OF_NUMBERS.map((index) => (
              <div key={index} style={{ position: 'relative' }}>
                <Input
                  id={`word-${index}`}
                  name={`word-${index}`}
                  style={{ width: '100%', paddingLeft: 40 }}
                  type={
                    hoveredInput === index || focusedInput === index
                      ? 'text'
                      : 'password'
                  }
                  required={index < phraseMode}
                  value={value[index]}
                  disabled={index >= phraseMode}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onChange={(e) =>
                    setValue((current) => {
                      return produce(current, (draft) => {
                        draft[index] = e.target.value;
                      });
                    })
                  }
                  onFocus={() => setFocusedInput(index)}
                  onBlur={() => setFocusedInput(null)}
                  onMouseEnter={() => setHoveredInputDebounced(index)}
                  onMouseLeave={() => setHoveredInputDebounced(null)}
                  onPaste={(e) => {
                    e.preventDefault();
                    const value = e.clipboardData.getData('text/plain');
                    handlePaste(index, value);
                  }}
                  autoFocus={index === 0}
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
          <Button
            kind="primary"
            style={{ width: '100%' }}
            disabled={isLoading || isWhitelistStatusLoading}
          >
            <HStack gap={8} alignItems="center" justifyContent="center">
              <span>Import wallet</span>
              {isLoading ? <CircleSpinner /> : null}
            </HStack>
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
  );
}
