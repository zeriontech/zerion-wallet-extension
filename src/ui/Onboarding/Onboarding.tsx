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
import * as styles from './styles.module.css';

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
        backgroundColor: 'var(--neutral-100)',
        ['--card-border-radius' as string]: '20px',
      }}
    >
      <div
        {...props}
        style={{
          paddingTop: HEADER_HEIGHT,
          maxWidth: MAX_CONTENT_WIDTH,
          marginInline: 'auto',
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
      className={styles.header}
      style={{
        height: `calc(${HEADER_HEIGHT} - 24px)`,
        paddingLeft: CONTENT_PADDING,
        paddingRight: CONTENT_PADDING,
      }}
    >
      <HStack
        className={styles.headerContent}
        gap={24}
        justifyContent="space-between"
        alignItems="center"
        style={{
          maxWidth: MAX_CONTENT_WIDTH,
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
        <Route
          path="/"
          element={<Navigate to="/onboarding" replace={true} />}
        />
        <Route path="/onboarding" element={<Welcome />} />
        <Route
          path="/onboarding/welcome/:walletAddress"
          element={<Dashboard />}
        />
        <Route
          path="/onboarding/import/:walletAddress/:type"
          element={<Import />}
        />
        <Route path="/onboarding/success" element={<Success />} />
        <Route
          path="*"
          element={<Navigate to="/onboarding" replace={true} />}
        />
      </Routes>
    </PageLayout>
  );
}
