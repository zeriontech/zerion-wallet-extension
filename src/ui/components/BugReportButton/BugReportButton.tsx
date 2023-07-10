import React from 'react';
import { useLayoutEffect } from 'react';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import * as helperStyles from 'src/ui/style/helpers.module.css';
import { useLocation } from 'react-router-dom';
import { UIText } from 'src/ui/ui-kit/UIText';
import BugIcon from 'jsx:src/ui/assets/bug.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { openInNewWindow } from 'src/ui/shared/openInNewWindow';
import { PageColumn } from '../PageColumn';
import * as s from './styles.module.css';
import { useBugReportURL } from './useBugReportURL';

export const BUTTON_HEIGHT = 29;

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
        height: BUTTON_HEIGHT,
        bottom: 0,
        width: '100%',
        zIndex: 1,
      }}
    >
      <div
        style={{
          // Yes, it's a position: fixed element inside position: sticky element
          // It's a hack to achieve the following:
          // * Make the button always visible at the bottom
          // * When you scroll down, the btn doesn't appear over the last elements of the page
          // * When page is empty (e.g. loading), the button is still at the bottom
          // * Not waste more time on this
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function BugReportButton() {
  const { pathname } = useLocation();
  const bugReportURL = useBugReportURL();
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
            // Open report URL in a new _window_ so that extension UI stays open.
            // This should help the user describe the issue better
            onClick={openInNewWindow}
            href={bugReportURL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <HStack
              gap={8}
              justifyContent="center"
              style={{
                position: 'relative',
                // small offset for better visual centering because of <BugIcon /> padding
                left: -2,
              }}
            >
              <BugIcon />
              <span>Bug Report</span>
            </HStack>
          </UnstyledAnchor>
        </UIText>
      </PageColumn>
    </BottomFixed>
  );
}
