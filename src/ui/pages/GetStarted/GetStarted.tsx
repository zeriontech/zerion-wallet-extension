import React, { useEffect, useRef } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { Button } from 'src/ui/ui-kit/Button';
import { PageHeading } from 'src/ui/components/PageHeading';
import { PageTop } from 'src/ui/components/PageTop';
import { PageColumn } from 'src/ui/components/PageColumn';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Surface } from 'src/ui/ui-kit/Surface';
import { GenerateWallet } from './GenerateWallet';
import { ImportWallet } from './ImportWallet';
import { Background } from 'src/ui/components/Background';

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
  const autoFocusRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    autoFocusRef.current?.focus();
  }, []);
  return (
    <Background backgroundColor="var(--background)">
      <PageColumn>
        <PageTop />
        <PageHeading>
          Introducing{' '}
          <span style={{ color: 'var(--primary)' }}>Zerion Wallet</span>
        </PageHeading>
        <Spacer height={4} />
        <UIText kind="subtitle/l_reg">Explore all of Web3 in one place</UIText>

        <Spacer height={32} />

        <Surface padding={16}>
          <VStack gap={16}>
            <Button ref={autoFocusRef} as={Link} to="new" size={60}>
              Create new Wallet
            </Button>
            <UIText kind="subtitle/l_reg" color="var(--neutral-500)">
              <TitleWithLine lineColor="var(--neutral-300)">or</TitleWithLine>
            </UIText>
            <Button kind="regular" as={Link} to="import" size={56}>
              Import existing wallet
            </Button>
            <UIText kind="subtitle/m_reg" color="var(--neutral-500)">
              Use this option if you want to import an existing wallet using a
              seed phrase or a private key
            </UIText>
          </VStack>
        </Surface>
      </PageColumn>
    </Background>
  );
}

export function GetStarted() {
  return (
    <Routes>
      <Route path="/" element={<Options />} />
      <Route path="/new" element={<GenerateWallet />} />
      <Route path="/import" element={<ImportWallet />} />
    </Routes>
  );
}
