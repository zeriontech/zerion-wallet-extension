import React, { useState } from 'react';
import browser from 'webextension-polyfill';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import { accountPublicRPCPort, walletPort } from 'src/ui/shared/channels';
import { Button } from 'src/ui/ui-kit/Button';
import { PageHeading } from 'src/ui/components/PageHeading';
import { PageTop } from 'src/ui/components/PageTop';
import { PageColumn } from 'src/ui/components/PageColumn';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Surface } from 'src/ui/ui-kit/Surface';
import { HStack } from 'src/ui/ui-kit/HStack';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { BlockieImg } from 'src/ui/components/BlockieImg';

function DecorativeMessage({
  text,
  isConsecutive = false,
}: {
  text: React.ReactNode;
  isConsecutive?: boolean;
}) {
  return (
    <HStack
      gap={8}
      alignItems="start"
      style={{
        gridTemplateColumns: 'minmax(min-content, max-content) auto',
      }}
    >
      <div
        style={{
          visibility: isConsecutive ? 'hidden' : undefined,
          borderRadius: '50%',
          padding: 4,
          border: '2px solid var(--white)',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <img
          src={browser.runtime.getURL(
            require('src/ui/assets/zerion-logo-round@2x.png')
          )}
          style={{
            width: 32,
            height: 32,
          }}
        />
      </div>
      <Surface style={{ padding: 12, borderTopLeftRadius: 4 }}>{text}</Surface>
    </HStack>
  );
}

function DecorativeMessageDone({ address }: { address: string }) {
  return (
    <>
      <DecorativeMessage
        text={
          <UIText kind="h/6_med">
            All done!{' '}
            <span style={{ color: 'var(--primary)' }}>
              Your wallet has been created 🚀
            </span>
          </UIText>
        }
      />
      <DecorativeMessage
        isConsecutive={true}
        text={
          <VStack gap={8}>
            <UIText kind="subtitle/m_reg">Now you are a proud owner of</UIText>
            <Surface
              style={{
                padding: 12,
                backgroundColor: 'var(--background)',
              }}
            >
              <HStack gap={12} alignItems="center">
                <BlockieImg address={address} size={44} />
                <div>
                  <UIText kind="subtitle/l_reg" title={address}>
                    {truncateAddress(address, 8)}
                  </UIText>
                </div>
              </HStack>
            </Surface>
          </VStack>
        }
      />
    </>
  );
}

enum Step {
  loading,
  done,
}

function GenerateWallet() {
  const navigate = useNavigate();
  const [steps, setSteps] = useState(() => new Set<Step>());
  const addStep = (step: Step) => setSteps((steps) => new Set(steps).add(step));

  const {
    mutate: generateMnemonics,
    data,
    isLoading,
  } = useMutation(
    async () => {
      addStep(Step.loading);
      await new Promise((r) => setTimeout(r, 1000));
      return walletPort.request('generateMnemonic');
    },
    {
      onSuccess() {
        addStep(Step.done);
      },
    }
  );
  Object.assign(window, { accountPublicRPCPort });
  console.log(steps, data);
  return (
    <div style={{ flexGrow: 1, backgroundColor: 'var(--background)' }}>
      <PageColumn>
        <PageTop />
        <PageHeading>Get Started</PageHeading>

        <Spacer height={32} />

        {/*
        {data?.phrase ? (
          <div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                backgroundColor: '#f0f0f0',
                padding: 20,
                borderRadius: 8,
                margin: 20,
              }}
            >
              <span style={{ fontSize: '1.5em', marginLeft: 8 }}>
                {data.phrase}
              </span>
            </div>
            <div style={{ height: 24 }}></div>
            <div style={{ textAlign: 'center' }}>
              <Button
                onClick={() => {
                  walletPort.request('savePendingWallet').then(() => {
                    navigate('/overview');
                  });
                }}
              >
                Finish
              </Button>
            </div>
          </div>
        */}
        <VStack gap={16}>
          <VStack gap={8}>
            <DecorativeMessage
              text={
                <UIText kind="subtitle/m_reg">
                  Wallet will be encrypted with your password
                </UIText>
              }
            />
            {steps.has(Step.loading) ? (
              <DecorativeMessage
                text={
                  <UIText kind="subtitle/m_reg">
                    Hi 👋 We're generating your wallet and making sure it's
                    encrypted with your passcode. This should only take a couple
                    of minutes.
                  </UIText>
                }
              />
            ) : null}
            {data?.address ? (
              <DecorativeMessageDone address={data.address} />
            ) : null}
          </VStack>
          {data ? (
            <VStack gap={4}>
              <Button
                onClick={() => {
                  console.log('savePendingWallet click');
                  accountPublicRPCPort.request('saveUserAndWallet').then(() => {
                    navigate('/overview');
                  });
                }}
              >
                Finish
              </Button>
            </VStack>
          ) : (
            <Button
              onClick={() => {
                generateMnemonics();
              }}
            >
              {isLoading ? 'Generating...' : 'Generate new Wallet'}
            </Button>
          )}
        </VStack>
      </PageColumn>
    </div>
  );
}

function TitleWithLine({
  children,
  lineColor = 'currentcolor',
  gap = 8,
}: React.PropsWithChildren<{ lineColor?: string; gap?: number }>) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        gap,
        alignItems: 'center',
      }}
    >
      <div style={{ height: 1, backgroundColor: lineColor }}></div>
      {children}
      <div style={{ height: 1, backgroundColor: lineColor }}></div>
    </div>
  );
}

function Options() {
  return (
    <div style={{ flexGrow: 1, backgroundColor: 'var(--background)' }}>
      <PageColumn>
        <PageTop />
        <PageHeading>
          Introducing{' '}
          <span style={{ color: 'var(--primary)' }}>Zerion Wallet</span>
        </PageHeading>
        <Spacer height={4} />
        <UIText kind="subtitle/l_reg">Explore All of Web3 on One Place</UIText>

        <Spacer height={32} />

        <Surface padding={16}>
          <VStack gap={16}>
            <Button as={Link} to="/get-started/new" size={60}>
              Create new Wallet
            </Button>
            <UIText kind="subtitle/l_reg" color="var(--neutral-500)">
              <TitleWithLine>or</TitleWithLine>
            </UIText>
            <Button kind="regular" as={Link} to="/get-started/new" size={56}>
              Import existing wallet
            </Button>
          </VStack>
        </Surface>
      </PageColumn>
    </div>
  );
}

export function GetStarted() {
  return (
    <Routes>
      <Route path="/" element={<Options />} />
      <Route path="/new" element={<GenerateWallet />} />
    </Routes>
  );
}
