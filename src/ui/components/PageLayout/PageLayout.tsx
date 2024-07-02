import React, { useMemo } from 'react';
import { RenderArea } from 'react-area';
import Logo from 'jsx:src/ui/assets/zerion-full-logo.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { useBodyStyle } from 'src/ui/components/Background/Background';
import * as styles from './styles.module.css';

const HEADER_HEIGHT = 72;
const MAX_CONTENT_WIDTH = 870;
const HARDWARE_IMPORT_MAX_WIDTH = 425;
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
  hardwareImportStyle,
  ...props
}: React.HTMLProps<HTMLDivElement> & { hardwareImportStyle?: boolean }) {
  useBodyStyle(
    useMemo(
      () => ({
        ['--background' as string]: 'var(--neutral-100)',
      }),
      []
    )
  );

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
          paddingTop: hardwareImportStyle ? 0 : HEADER_HEIGHT,
          maxWidth: hardwareImportStyle
            ? HARDWARE_IMPORT_MAX_WIDTH
            : MAX_CONTENT_WIDTH,
          marginInline: 'auto',
          ...style,
        }}
      >
        {hardwareImportStyle ? null : <Header />}
        {children}
      </div>
    </div>
  );
}
