import React, { useEffect, useReducer, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import IconLeft from 'jsx:src/ui/assets/chevron-left-medium.svg';
import { RenderArea } from 'react-area';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Store } from 'store-unit';
import { useStore } from '@store-unit/react';
import { getPageTemplateType } from 'src/ui/shared/getPageTemplateName';

function capitalize(str: string) {
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
}

function titleFromPathname(pathname: string) {
  const parts = pathname.split('/');
  const last = parts[parts.length - 1];
  return last.split('-').map(capitalize).join(' ');
}

const URLBarBlacklist = new Set([
  '/',
  '/intro',
  '/overview',
  '/overview/nfts',
  '/overview/history',
  '/login',
  '/sendTransaction',
]);

export function hideURLBarFor(path: string) {
  URLBarBlacklist.add(path);
}

const urlBarStore = new Store(true);

const templateType = getPageTemplateType();
const isDialog = templateType === 'dialog';

export function toggleUrlBar(on: boolean) {
  urlBarStore.setState(on);
}

export function BackButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
) {
  return (
    <UnstyledButton aria-label="Go back" style={{ padding: 8 }} {...props}>
      <IconLeft role="presentation" style={{ display: 'block' }} />
    </UnstyledButton>
  );
}

// This value is just a result of inner components
// If styles are changed, this value needs to be updated manually
export const NAVIGATION_BAR_HEIGHT = 46;

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
        backgroundColor: 'var(--background)',
        opacity: pathname !== pathnameRef.current ? 0 : 1,
        paddingTop: 8,
        paddingLeft: 8,
        paddingRight: 8,
        display: 'grid',
        alignItems: 'center',
        gridTemplateColumns: '40px 1fr 40px',
      }}
    >
      <RenderArea
        name="navigation-bar-back-button"
        children={(children) => {
          return children.length ? (
            children
          ) : (
            <BackButton onClick={() => navigate(-1)} />
          );
        }}
      />

      <RenderArea
        name="navigation-bar"
        children={(children) => {
          let text: React.ReactNode;
          // This check is done to work around an unavoidable inconsistent state
          // where this callback function is called first because of pathname change
          // and then later because some <Content /> element was added
          if (!children.length && pathnameRef.current !== pathname) {
            text = null;
          } else {
            text = children.length ? children : titleFromPathname(pathname);
          }
          return (
            <UIText
              kind="body/accent"
              style={{
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {text}
            </UIText>
          );
        }}
      />
      <span />
    </nav>
  );
}
