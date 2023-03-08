import React, { useCallback, useMemo, useRef, useState } from 'react';
import { animated, useSpring } from 'react-spring';
import { useMutation } from 'react-query';
import debounce from 'lodash/debounce';
import type { BareWallet } from 'src/shared/types/BareWallet';
import { validate } from 'src/ui/pages/GetStarted/ImportWallet/ImportWallet';
import { ValidationResult } from 'src/shared/validation/ValidationResult';
import { prepareUserInputSeedOrPrivateKey } from 'src/ui/shared/prepareUserInputSeedOrPrivateKey';
import { Button } from 'src/ui/ui-kit/Button';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { getFirstNMnemonicWallets } from 'src/ui/pages/GetStarted/ImportWallet/MnemonicImportView/getFirstNMnemonicWallets';
import { getError } from 'src/shared/errors/getError';
import { useSizeStore } from '../useSizeStore';
import { useWhitelistStatus } from '../checkWhitelistStatus';
import * as styles from './styles.module.css';
import { Input } from './Input';

const INPUT_NUMBER = 24;
const ARRAY_OF_NUMBERS = [...Array(INPUT_NUMBER).keys()];

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
  const [value, setValue] = useState<string[]>(ARRAY_OF_NUMBERS.map(() => ''));
  const [hoveredInput, setHoveredInput] = useState<number | null>(null);
  const [focusedInput, setFocusedInput] = useState<number | null>(null);

  const debouncedSetHoverRef = useRef<(index: number | null) => void>();
  if (!debouncedSetHoverRef.current) {
    debouncedSetHoverRef.current = debounce((index: number | null) => {
      setHoveredInput(index);
    }, 150);
  }

  const { data: isWhitelisted, isLoading: isWhitelistStatusLoading } =
    useWhitelistStatus(address);

  const { mutate, isLoading } = useMutation(
    async (value: string) => {
      setValidation(null);
      if (!isWhitelisted) {
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
    {
      onSuccess: (wallet) => {
        if (wallet) {
          onWalletCreate(wallet);
        }
      },
      onError: (error) => {
        setValidation({
          valid: false,
          message: getError(error).message,
        });
      },
    }
  );

  const gridStyle = useSpring({
    maxHeight: phraseMode === 24 ? '440px' : '216px',
    height: phraseMode === 24 ? '440px' : '216px',
  });

  const handlePaste = useCallback((index: number, value: string) => {
    const splittedValue = value.trim().split(/\s+/);
    setValue((current) => [
      ...current.slice(0, index),
      ...splittedValue,
      ...(index + splittedValue.length < current.length
        ? current.slice(index + splittedValue.length)
        : []
      ).slice(0, INPUT_NUMBER),
    ]);
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
                      return [
                        ...current.slice(0, index),
                        e.target.value,
                        ...current.slice(index + 1),
                      ];
                    })
                  }
                  onFocus={() => setFocusedInput(index)}
                  onBlur={() => setFocusedInput(null)}
                  onMouseEnter={() => debouncedSetHoverRef.current?.(index)}
                  onMouseLeave={() => debouncedSetHoverRef.current?.(null)}
                  onPaste={(e) => {
                    e.preventDefault();
                    const value = e.clipboardData.getData('text/plain');
                    handlePaste(index, value);
                  }}
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
          {isLoading ? (
            <UIText kind="caption/regular" style={errorStyle}>
              Parsing secret key
            </UIText>
          ) : null}
        </VStack>
      </form>
    </VStack>
  );
}
