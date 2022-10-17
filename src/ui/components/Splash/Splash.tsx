import React from 'react';
import ZerionLogoText from 'jsx:src/ui/assets/zerion-logo-text.svg';

export function Splash() {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          flexGrow: 1,
          display: 'grid',
          alignItems: 'center',
          placeContent: 'center',
        }}
      >
        <ZerionLogoText />
      </div>
    </div>
  );
}
