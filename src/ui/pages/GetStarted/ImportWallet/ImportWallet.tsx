import React, { useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { Background } from 'src/ui/components/Background';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { prepareUserInputSeedOrPrivateKey } from 'src/ui/shared/prepareUserInputSeedOrPrivateKey';
import { Button } from 'src/ui/ui-kit/Button';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import QuestionHintIcon from 'jsx:src/ui/assets/question-hint.svg';
import ShieldIcon from 'jsx:src/ui/assets/shield.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import type { ValidationResult } from 'src/shared/validation/ValidationResult';
import { SeedType } from 'src/shared/SeedType';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageBottom } from 'src/ui/components/PageBottom';
import {
  isValidMnemonic,
  isValidPrivateKey,
} from 'src/shared/validation/wallet';
import { WithPasswordSession } from 'src/ui/components/VerifyUser/WithPasswordSession';
import { SecretInput } from 'src/ui/components/SecretInput';
import { PrivateKeyImportView } from './PrivateKeyImportView';
import { MnemonicImportView } from './MnemonicImportView';
import { MemoryLocationState } from './memoryLocationState';

function getSeedType(value: string) {
  if (isValidMnemonic(value)) {
    return SeedType.mnemonic;
  } else if (isValidPrivateKey(value)) {
    return SeedType.privateKey;
  } else {
    return null;
  }
}

function validate({
  recoveryInput,
}: {
  recoveryInput: string;
}): ValidationResult {
  if (recoveryInput.trim().split(/\s+/).length > 1) {
    // probably a mnemonic
    if (isValidMnemonic(recoveryInput)) {
      return { valid: true, message: '' };
    } else {
      return { valid: false, message: 'Invalid recovery phrase' };
    }
  } else {
    if (isValidPrivateKey(recoveryInput)) {
      return { valid: true, message: '' };
    } else {
      return { valid: false, message: 'Invalid private key' };
    }
  }
}

function ImportForm({
  onSubmit,
}: {
  onSubmit: (result: { value: string; seedType: SeedType }) => void;
}) {
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  return (
    <>
      <form
        style={{ display: 'flex', flexGrow: 1, flexDirection: 'column' }}
        onInput={() => setValidationResult(null)}
        onSubmit={(event) => {
          event.preventDefault();
          const userInput = new FormData(event.currentTarget).get(
            'seedOrPrivateKey'
          ) as string;
          const value = prepareUserInputSeedOrPrivateKey(userInput);
          if (!value) {
            return;
          }
          const validity = validate({ recoveryInput: value });
          setValidationResult(validity);
          if (!validity.valid) {
            return;
          }
          const seedType = getSeedType(value);
          if (seedType == null) {
            throw new Error('Unexpected input value');
          }
          onSubmit({ value, seedType });
        }}
      >
        <SecretInput
          showRevealElement={false}
          autoFocus={true}
          name="seedOrPrivateKey"
          required={true}
          label={
            <UIText kind="caption/regular" color="var(--neutral-600)">
              Use spaces between words if using a recovery phrase
            </UIText>
          }
          hint={
            validationResult?.valid === false ? (
              <UIText
                kind="caption/regular"
                color="var(--negative-500)"
                role="alert"
              >
                {validationResult.message}
              </UIText>
            ) : null
          }
        />
        <VStack gap={16} style={{ marginTop: 'auto' }}>
          <UIText kind="caption/reg" color="var(--neutral-500)">
            <HStack
              gap={4}
              alignItems="center"
              style={{
                marginLeft: 'auto',
                marginRight: 'auto',
                width: 'max-content',
              }}
            >
              <ShieldIcon />
              <span>Zerion passed security audits</span>
            </HStack>
          </UIText>
          <Button style={{ width: '100%' }}>Import</Button>
        </VStack>
      </form>
    </>
  );
}

function ImportWalletView({
  locationStateStore,
}: {
  locationStateStore: MemoryLocationState;
}) {
  const navigate = useNavigate();

  return (
    <>
      <NavigationTitle title="Import Wallet" />

      <Background backgroundKind="white">
        <PageColumn>
          <PageTop />
          <UIText kind="h/5_med">
            Enter Recovery Phrase{' '}
            <QuestionHintIcon
              style={{ color: 'var(--neutral-500)', verticalAlign: 'middle' }}
            />{' '}
            <br />
            or a Private Key{' '}
            <QuestionHintIcon
              style={{ color: 'var(--neutral-500)', verticalAlign: 'middle' }}
            />
          </UIText>
          <Spacer height={24}></Spacer>
          <ImportForm
            onSubmit={({ value, seedType }) => {
              if (seedType === SeedType.privateKey) {
                // NOTE:
                // see locationStateStore for why and how it's used instead of location state
                const pathname = '/get-started/import/private-key';
                const to = `${pathname}?state=memory`;
                locationStateStore.set(pathname, value);
                navigate(to);
              } else if (seedType === SeedType.mnemonic) {
                // NOTE:
                // see locationStateStore for why it's used instead of location state
                const pathname = '/get-started/import/mnemonic';
                const to = `${pathname}?state=memory`;
                locationStateStore.set(pathname, value);
                navigate(to);
              }
            }}
          />
          <PageBottom />
        </PageColumn>
      </Background>
    </>
  );
}

export function ImportWallet() {
  const [memoryLocationState] = useState(() => new MemoryLocationState({}));
  return (
    <Routes>
      <Route
        path="/"
        element={<ImportWalletView locationStateStore={memoryLocationState} />}
      />
      <Route
        path="/private-key"
        element={
          <PrivateKeyImportView locationStateStore={memoryLocationState} />
        }
      />
      <Route
        path="/mnemonic"
        element={
          <WithPasswordSession text="Recovery phrase will be encrypted with your password">
            <MnemonicImportView locationStateStore={memoryLocationState} />
          </WithPasswordSession>
        }
      />
    </Routes>
  );
}
