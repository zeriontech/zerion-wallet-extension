// TODO: get this file from the new onboarding flow

import React from 'react';
import { RenderArea } from 'react-area';
import { HStack } from 'src/ui/ui-kit/HStack';
import Logo from 'jsx:src/ui/assets/zerion-full-logo.svg';
import * as styles from '../../Onboarding/styles.module.css';

const HEADER_HEIGHT = 72;
const MAX_CONTENT_WIDTH = 870;
const CONTENT_PADDING = 24;

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
export function PageLayout({
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
        <Header />
        {children}
      </div>
    </div>
  );
}
