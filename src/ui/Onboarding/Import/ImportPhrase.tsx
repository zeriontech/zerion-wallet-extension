import React, { useCallback, useState } from 'react';
import { animated, useSpring } from 'react-spring';
import { useMutation } from 'react-query';
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
import * as styles from './styles.module.css';
import { Input } from './Input';

const INPUT_NUMBER = 24;
const ARRAY_OF_NUMBERS = [...Array(INPUT_NUMBER).keys()];

export function ImportPhrase({
  address,
  onWalletCreate,
}: {
  address?: string;
  onWalletCreate(wallet: BareWallet): void;
}) {
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [phraseMode, setPhraseMode] = useState<12 | 24>(12);
  const [value, setValue] = useState<string[]>(ARRAY_OF_NUMBERS.map(() => ''));

  const { mutate, isLoading } = useMutation(
    async (value: string) => {
      setValidation(null);
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
        setValidation({
          valid: false,
          message: "We can't find your wallet by this phrase",
        });
        return;
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
              <Input
                key={index}
                name={`word-${index}`}
                placeholder={`${index + 1}`}
                style={{ width: '100%' }}
                type="password"
                required={index < phraseMode}
                value={value[index]}
                onChange={(e) =>
                  setValue((current) => {
                    return [
                      ...current.slice(0, index),
                      e.target.value,
                      ...current.slice(index + 1),
                    ];
                  })
                }
                onPaste={(e) => {
                  e.preventDefault();
                  const value = e.clipboardData.getData('text/plain');
                  handlePaste(index, value);
                }}
              />
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
          <Button kind="primary" style={{ width: '100%' }} disabled={isLoading}>
            Import wallet
          </Button>
          {!validation || validation.valid ? null : (
            <UIText
              kind="caption/regular"
              color="var(--negative-500)"
              style={{ position: 'absolute', bottom: -24 }}
            >
              {validation.message}
            </UIText>
          )}
          {isLoading ? (
            <UIText
              kind="caption/regular"
              style={{ position: 'absolute', bottom: -24 }}
            >
              Parsing secret key
            </UIText>
          ) : null}
        </VStack>
      </form>
    </VStack>
  );
}
