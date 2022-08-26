import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ZerionLogoWide from 'src/ui/assets/zerion-logo-wide.svg';
import { Button } from 'src/ui/ui-kit/Button';

export function Intro() {
  const autoFocusRef = useRef<HTMLAnchorElement | null>(null);
  useEffect(() => {
    autoFocusRef.current?.focus();
  }, []);
  return (
    <div
      style={{
        flexGrow: 1,
        display: 'grid',
        alignItems: 'center',
        placeContent: 'center',
        gridTemplateRows: '1fr 1fr 1fr',
      }}
    >
      <div></div>
      <ZerionLogoWide />
      <div style={{ textAlign: 'center' }}>
        <Button ref={autoFocusRef} as={Link} to="/create-account">
          Get Started...
        </Button>
      </div>
    </div>
  );
}
