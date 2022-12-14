import browser from 'webextension-polyfill';
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
import { detectBrowser } from './detectBrowser';

const BUTTON_HEIGHT = 29;

const urlBlacklist = new Set(['/', '/intro', '/get-started']);
const { browser: browserName, version: browserVersion } = detectBrowser(
  navigator.userAgent
);

function openInNewWindow(
  event: React.MouseEvent<HTMLAnchorElement, MouseEvent>
) {
  // Open report URL in a new _window_ so that extension UI stays open.
  // This should help the user describe the issue better
  event.preventDefault();
  browser.windows.create({
    url: event.currentTarget.getAttribute('href') as string,
    width: 600,
    height: 800,
  });
}

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
          width: '100%',
        }}
      >
        {children}
      </div>
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
            onClick={openInNewWindow}
            href={`https://zerion-io.typeform.com/bug-report#${new URLSearchParams(
              {
                version,
                pathname,
                browser: `${browserName}/${browserVersion}`,
                platform: navigator.platform,
                search,
              }
            )}`}
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
