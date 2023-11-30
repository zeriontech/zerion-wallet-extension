import React, { useMemo } from 'react';
import { useLayoutEffect } from 'react';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { useLocation } from 'react-router-dom';
import { UIText } from 'src/ui/ui-kit/UIText';
import BugIcon from 'jsx:src/ui/assets/bug.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { openInNewWindow } from 'src/ui/shared/openInNewWindow';
import { SurfaceItemAnchor } from 'src/ui/ui-kit/SurfaceList';
import { AngleRightRow } from '../AngleRightRow';
import { PageColumn } from '../PageColumn';
import { getBugButtonUrl } from './getBugReportURL';
import * as s from './styles.module.css';

export const BUTTON_HEIGHT =
  process.env.FEATURE_FOOTER_BUG_BUTTON === 'on' ? 29 : 0;

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

export function FooterBugReportButton() {
  const { pathname, search } = useLocation();
  const bugReportURL = useMemo(
    () => getBugButtonUrl(pathname, search),
    [pathname, search]
  );
  if (process.env.FEATURE_FOOTER_BUG_BUTTON !== 'on') {
    return null;
  }
  if (urlBlacklist.has(pathname)) {
    return null;
  }

  return (
    <BottomFixed>
      <PageColumn style={{ padding: 0 }}>
        <UnstyledAnchor
          className={s.link}
          // Open report URL in a new _window_ so that extension UI stays open.
          // This should help the user describe the issue better
          onClick={openInNewWindow}
          href={bugReportURL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <UIText kind="small/accent">
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
          </UIText>
        </UnstyledAnchor>
      </PageColumn>
    </BottomFixed>
  );
}

export function BugReportButton() {
  const { pathname, search } = useLocation();
  const bugReportURL = useMemo(
    () => getBugButtonUrl(pathname, search),
    [pathname, search]
  );
  if (urlBlacklist.has(pathname)) {
    return null;
  }

  return (
    <SurfaceItemAnchor
      href={bugReportURL}
      onClick={openInNewWindow}
      target="_blank"
      rel="noopener noreferrer"
    >
      <AngleRightRow kind="link">
        <HStack gap={8} alignItems="center">
          <BugIcon style={{ width: 24, height: 24 }} />
          <UIText kind="body/regular">Bug Report</UIText>
        </HStack>
      </AngleRightRow>
    </SurfaceItemAnchor>
  );
}
