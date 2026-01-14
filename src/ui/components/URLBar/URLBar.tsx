import React, { useEffect, useLayoutEffect, useReducer, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RenderArea } from 'react-area';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Store } from 'store-unit';
import { useStore } from '@store-unit/react';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import { getBackOrHome } from 'src/ui/shared/navigation/getBackOrHome';
import { getDocumentTitle } from 'src/ui/shared/getDocumentTitle';
import { BackButton } from '../BackButton';

function capitalize(str: string) {
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
}

function titleFromPathname(pathname: string) {
  const parts = pathname.split('/');
  const last = parts[parts.length - 1];
  return last
    .split(/(?:-|%20)/)
    .map(capitalize)
    .join(' ');
}

const URLBarBlacklist = new Set([
  '/',
  '/intro',
  '/overview',
  '/overview/nfts',
  '/overview/history',
  '/login',
  '/addEthereumChain',
  '/switchEthereumChain',
  '/sendTransaction',
  '/signMessage',
  '/signTypedData',
  '/invite',
  '/requestAccounts',
  '/testnetModeGuard',
  '/phishing-warning',
  '/restore-data',
]);

export function hideURLBarFor(path: string) {
  URLBarBlacklist.add(path);
}

const urlBarStore = new Store(true);

const isDialog = false; // pageTemplateType === 'dialog';

export function toggleUrlBar(on: boolean) {
  urlBarStore.setState(on);
}

// This value is just a result of inner components
// If styles are changed, this value needs to be updated manually
export const NAVIGATION_BAR_HEIGHT = 46;

export function DocumentTitle({ title }: { title: string }) {
  useLayoutEffect(() => {
    document.title = getDocumentTitle(title);
  }, [title]);
  return null;
}

export function URLBar() {
  const navigate = useNavigate();
  const [, rerender] = useReducer((n) => n + 1, 0);
  const { pathname } = useLocation();
  const shouldDisplay = useStore(urlBarStore);

  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
    rerender();
  }, [pathname]);

  if (URLBarBlacklist.has(pathname) || !shouldDisplay || isDialog) {
    return null;
  }

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1,
        backgroundColor: 'var(--url-bar-background, var(--background))',
        backdropFilter: 'var(--url-bar-backdrop-filter, none)',
        opacity: pathname !== pathnameRef.current ? 0 : 1,
        paddingTop: 16,
        paddingInline: 8,
        paddingBottom: 'var(--url-bar-padding-bottom, 0)',
        display: 'grid',
        alignItems: 'center',
        gridTemplateColumns: '36px 1fr 40px',
      }}
    >
      <RenderArea
        name="navigation-bar-back-button"
        children={(children) => {
          return children.length ? (
            children
          ) : (
            <>
              <BackButton
                onClick={() => navigate(getBackOrHome() as number)}
                title={'Press "backspace" to navigate back'}
              />
              <KeyboardShortcut
                combination="backspace"
                onKeyDown={() => navigate(-1)}
              />
            </>
          );
        }}
      />

      <RenderArea
        name="navigation-bar"
        children={(children) => {
          let maybeText: React.ReactNode;
          // This check is done to work around an unavoidable inconsistent state
          // where this callback function is called first because of pathname change
          // and then later because some <Content /> element was added
          let automaticTitle: null | string = null;
          if (!children.length && pathnameRef.current !== pathname) {
            maybeText = null;
          } else {
            if (children.length) {
              // we want to wrap url content only in case it is a string
              // in this case it is enough to get only the first element and check its type later
              maybeText = children[0];
            } else {
              automaticTitle = titleFromPathname(pathname);
              maybeText = automaticTitle;
            }
          }
          return (
            <>
              {automaticTitle ? <DocumentTitle title={automaticTitle} /> : null}
              {typeof maybeText === 'string' ? (
                <UIText
                  kind="body/accent"
                  style={{
                    textAlign: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {maybeText}
                </UIText>
              ) : (
                <div>{children}</div>
              )}
            </>
          );
        }}
      />
      <RenderArea name="navigation-bar-end" />
    </nav>
  );
}
