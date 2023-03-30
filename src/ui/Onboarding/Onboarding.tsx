import React, { useMemo } from 'react';
import { RenderArea } from 'react-area';
import { Routes, Route, Navigate } from 'react-router-dom';
import Logo from 'jsx:src/ui/assets/zerion-full-logo.svg';
import { useScreenViewChange } from '../shared/useScreenViewChange';
import { HStack } from '../ui-kit/HStack';
import { useBodyStyle } from '../components/Background/Background';
import { Dashboard } from './Dashboard';
import { Welcome } from './Welcome';
import { Import } from './Import';
import { Success } from './Success';

const HEADER_HEIGHT = 72;
const MAX_CONTENT_WIDTH = 870;
const CONTENT_PADDING = 24;

function PageLayout({
  style,
  children,
  ...props
}: React.HTMLProps<HTMLDivElement>) {
  return (
    <div
      style={{
        width: '100%',
        paddingLeft: CONTENT_PADDING,
        paddingRight: CONTENT_PADDING,
        paddingBottom: CONTENT_PADDING,
      }}
    >
      <div
        {...props}
        style={{
          paddingTop: HEADER_HEIGHT,
          maxWidth: MAX_CONTENT_WIDTH,
          marginLeft: 'auto',
          marginRight: 'auto',
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Header() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: `calc(${HEADER_HEIGHT} - 24px)`,
        paddingTop: 24,
        paddingLeft: CONTENT_PADDING,
        paddingRight: CONTENT_PADDING,
        zIndex: 'var(--navbar-index)',
        backgroundColor: 'var(--neutral-100)',
      }}
    >
      <HStack
        gap={24}
        justifyContent="space-between"
        alignItems="center"
        style={{
          maxWidth: MAX_CONTENT_WIDTH,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        <Logo />
        <RenderArea name="header-end" />
      </HStack>
    </div>
  );
}

export function Onboarding() {
  useScreenViewChange();
  useBodyStyle(
    useMemo(
      () => ({
        backgroundColor: 'var(--neutral-100)',
      }),
      []
    )
  );

  return (
    <PageLayout>
      <Header />
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route
          path="/onboarding/welcome/:walletAddress"
          element={<Dashboard />}
        />
        <Route
          path="/onboarding/import/:walletAddress/:type"
          element={<Import />}
        />
        <Route path="/onboarding/success" element={<Success />} />
        <Route path="*" element={<Navigate to="/" replace={true} />} />
      </Routes>
    </PageLayout>
  );
}
