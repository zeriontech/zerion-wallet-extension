import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import IconLeft from 'src/ui/assets/chevron-left.svg';
import { RenderArea } from 'react-area';
import { UIText } from 'src/ui/ui-kit/UIText';

function capitalize(str: string) {
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
}

function titleFromPathname(pathname: string) {
  const parts = pathname.split('/');
  const last = parts[parts.length - 1];
  return last.split('-').map(capitalize).join(' ');
}

const URLBarBlacklist = new Set(['/', '/intro', '/overview', '/login']);

export function URLBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  if (URLBarBlacklist.has(pathname)) {
    return null;
  }

  return (
    <div
      style={{
        paddingTop: 8,
        paddingLeft: 8,
        paddingRight: 8,
        display: 'grid',
        alignItems: 'center',
        gridTemplateColumns: '40px 1fr 40px',
      }}
    >
      <UnstyledButton onClick={() => navigate(-1)} style={{ padding: 8 }}>
        <IconLeft />
      </UnstyledButton>

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
            <UIText kind="h/6_reg" style={{ textAlign: 'center' }}>
              {text}
            </UIText>
          );
        }}
      />
      <span />
    </div>
  );
}
