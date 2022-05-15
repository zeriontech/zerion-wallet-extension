import React, { useState } from 'react';
import { Content } from 'react-area';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { Background } from 'src/ui/components/Background';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { accountPublicRPCPort, walletPort } from 'src/ui/shared/channels';
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
          <li>a seed phrase (12 words)</li>
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
          onSubmit(value as string);
        }}
      >
        <textarea
          autoFocus={true}
          name="seedOrPrivateKey"
          required={true}
          rows={3}
          placeholder="Enter seed phrase or a private key"
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

export function ImportWallet() {
  const [steps, setSteps] = useState(() => new Set<Step>());
  const addStep = (step: Step) => setSteps((steps) => new Set(steps).add(step));

  const navigate = useNavigate();

  const { data, ...importWallet } = useMutation(
    async (key: string) => {
      addStep(Step.loading);
      await new Promise((r) => setTimeout(r, 1000));
      return walletPort.request('importPrivateKey', key);
    },
    {
      onSuccess() {
        addStep(Step.done);
      },
    }
  );

  return (
    <>
      <Content name="navigation-bar">
        <span>Import Wallet</span>
      </Content>

      <Background backgroundColor="var(--background)">
        <PageColumn>
          <PageTop />
          <UIText kind="h/5_med">Seed Phrase or Private Key</UIText>
          <Spacer height={24}></Spacer>
          {steps.has(Step.loading) ? (
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
                  Could not import wallet
                </UIText>
              ) : null}
            </VStack>
          ) : (
            <ImportForm onSubmit={(key) => importWallet.mutate(key)} />
          )}
          {steps.has(Step.loading) ? (
            <Button
              style={{ marginTop: 'auto', marginBottom: 16 }}
              onClick={() => {
                accountPublicRPCPort.request('saveUserAndWallet').then(() => {
                  navigate('/overview');
                });
              }}
            >
              {importWallet.isLoading ? 'Recovering...' : 'Finish'}
            </Button>
          ) : null}
        </PageColumn>
      </Background>
    </>
  );
}
