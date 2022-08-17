import { ethers } from 'ethers';
import React, { useState } from 'react';
import { Content } from 'react-area';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { accountPublicRPCPort, walletPort } from 'src/ui/shared/channels';
import { prepareUserInputSeedOrPrivateKey } from 'src/ui/shared/prepareUserInputSeedOrPrivateKey';
import { Button } from 'src/ui/ui-kit/Button';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import {
  DecorativeMessage,
  DecorativeMessageDone,
} from '../components/DecorativeMessage';

function ImportForm({ onSubmit }: { onSubmit: (value: string) => void }) {
  return (
    <>
      <UIText kind="subtitle/m_reg" color="var(--neutral-700)">
        Existing wallets can be imported using either
        <ul style={{ listStyle: 'circle', paddingLeft: '1em', marginTop: 8 }}>
          <li>a recovery phrase (12 words)</li>
          <li>or a private key</li>
        </ul>
      </UIText>
      <Spacer height={24}></Spacer>
      <form
        style={{ display: 'flex', flexGrow: 1, flexDirection: 'column' }}
        onSubmit={(event) => {
          event.preventDefault();
          const value = new FormData(event.currentTarget).get(
            'seedOrPrivateKey'
          );
          if (!value) {
            return;
          }
          onSubmit(prepareUserInputSeedOrPrivateKey(value as string));
        }}
      >
        <textarea
          autoFocus={true}
          name="seedOrPrivateKey"
          required={true}
          rows={3}
          placeholder="Enter recovery phrase or a private key"
          style={{
            display: 'block',
            color: 'var(--black)',
            resize: 'vertical',
            backgroundColor: 'var(--white)',
            padding: '7px 11px',
            border: '1px solid var(--neutral-200)',
            borderRadius: 8,
          }}
        />
        <Button style={{ marginTop: 'auto', marginBottom: 16 }}>Import</Button>
      </form>
    </>
  );
}

enum Step {
  loading,
  done,
}

function isValidMnemonic(phrase: string) {
  return ethers.utils.isValidMnemonic(phrase);
}
function isValidPrivateKey(key: string) {
  const prefixedKey = key.startsWith('0x') ? key : `0x${key}`;
  return ethers.utils.isHexString(prefixedKey, 32);
}

export function ImportWallet() {
  const [steps, setSteps] = useState(() => new Set<Step>());
  const addStep = (step: Step) => setSteps((steps) => new Set(steps).add(step));

  const navigate = useNavigate();

  const { data, ...importWallet } = useMutation(
    async (input: string) => {
      addStep(Step.loading);
      await new Promise((r) => setTimeout(r, 1000));
      if (isValidMnemonic(input)) {
        return walletPort.request('uiImportSeedPhrase', input);
      } else if (isValidPrivateKey(input)) {
        return walletPort.request('uiImportPrivateKey', input);
      } else {
        throw new Error('Not a private key or a recovery phrase');
      }
    },
    {
      onSuccess() {
        addStep(Step.done);
      },
    }
  );
  const importError = importWallet.error ? (importWallet.error as Error) : null;

  return (
    <>
      <Content name="navigation-bar">
        <span>Import Wallet</span>
      </Content>

      <PageColumn>
        <PageTop />
        <UIText kind="h/5_med">Recovery Phrase or Private Key</UIText>
        <Spacer height={24}></Spacer>
        {steps.has(Step.loading) ? (
          <>
            <VStack gap={8}>
              <DecorativeMessage
                text={
                  <UIText kind="subtitle/m_reg">
                    Hi 👋 We're generating your wallet and making sure it's
                    encrypted with your passcode. This should only take a couple
                    of minutes.
                  </UIText>
                }
              />
              {data?.address ? (
                <DecorativeMessageDone
                  messageKind="import"
                  address={data.address}
                />
              ) : null}
              {importWallet.isError ? (
                <UIText kind="subtitle/m_reg" color="var(--negative-500)">
                  Could not import wallet{' '}
                  {importError?.message ? `(${importError.message})` : null}
                </UIText>
              ) : null}
            </VStack>

            <Button
              style={{ marginTop: 'auto', marginBottom: 16 }}
              onClick={async () => {
                await accountPublicRPCPort.request('saveUserAndWallet');
                if (data?.address) {
                  await walletPort.request('setCurrentAddress', {
                    address: data.address,
                  });
                }
                navigate('/overview');
              }}
            >
              {importWallet.isLoading ? 'Recovering...' : 'Finish'}
            </Button>
          </>
        ) : (
          <ImportForm onSubmit={(key) => importWallet.mutate(key)} />
        )}
      </PageColumn>
    </>
  );
}
