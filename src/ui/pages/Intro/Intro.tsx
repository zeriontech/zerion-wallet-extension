import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ZerionLogo from 'src/ui/assets/zerion-squircle.svg';
import ZerionLogoText from 'src/ui/assets/zerion-logo-text.svg';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';

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
        gridTemplateRows: '1fr 1fr 1fr',
        padding: '0 16px 24px',
      }}
    >
      <div></div>
      <HStack
        gap={18}
        alignItems="center"
        style={{ placeSelf: 'center', alignSelf: 'center' }}
      >
        <ZerionLogo style={{ width: 54, height: 54 }} />
        <ZerionLogoText style={{ height: 17 }} />
      </HStack>
      <Button
        ref={autoFocusRef}
        as={Link}
        // to="/create-account"
        to={`/get-started?beforeCreate=${encodeURIComponent(
          '/create-account'
        )}`}
        style={{ alignSelf: 'end' }}
      >
        Get Started
      </Button>
    </div>
  );
}
