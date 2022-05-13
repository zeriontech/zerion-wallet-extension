import React from 'react';
import { Link } from 'react-router-dom';
import ZerionLogoWide from 'src/ui/assets/zerion-logo-wide.svg';
import { Button } from 'src/ui/ui-kit/Button';

export function Intro() {
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
        <Button as={Link} to="/create-account" autoFocus={true}>
          Get Started...
        </Button>
      </div>
    </div>
  );
}
