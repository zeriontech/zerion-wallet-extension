import React from 'react';
import { useLayoutEffect } from 'react';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import * as helperStyles from 'src/ui/style/helpers.module.css';
import { useLocation } from 'react-router-dom';
import { UIText } from 'src/ui/ui-kit/UIText';
import BugIcon from 'jsx:src/ui/assets/bug.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { version } from 'src/shared/packageVersion';
import { PageColumn } from '../PageColumn';
import * as s from './styles.module.css';

const BUTTON_HEIGHT = 29;

const urlBlacklist = new Set(['/', '/intro', '/get-started']);

function BottomFixed({ children }: React.PropsWithChildren) {
  useLayoutEffect(() => {
    const prevPaddingBottom = document.body.style.paddingBottom;
    document.body.style.paddingBottom = `${BUTTON_HEIGHT}px`;
    return () => {
      document.body.style.paddingBottom = prevPaddingBottom;
    };
  }, []);
  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        width: '100%',
        zIndex: 1,
      }}
    >
      {children}
    </div>
  );
}

export function BugReportButton() {
  const { pathname, search } = useLocation();
  if (urlBlacklist.has(pathname)) {
    return null;
  }

  return (
    <BottomFixed>
      <PageColumn
        style={{
          borderTop: '1px solid var(--neutral-400)',
          backgroundColor: 'var(--neutral-200)',
          paddingTop: 4,
          paddingBottom: 4,
        }}
      >
        <UIText kind="small/accent" className={helperStyles.hoverUnderline}>
          <UnstyledAnchor
            className={s.link}
            href={`https://zerion-io.typeform.com/bug-report#${new URLSearchParams(
              {
                version,
                pathname,
                search,
              }
            )}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <HStack gap={8}>
              <BugIcon />
              <span>Bug Report</span>
            </HStack>
          </UnstyledAnchor>
        </UIText>
      </PageColumn>
    </BottomFixed>
  );
}
