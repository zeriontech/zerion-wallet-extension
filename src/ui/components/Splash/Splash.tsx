import React from 'react';
import ZerionLogoWide from 'src/ui/assets/zerion-logo-wide.svg';

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
        <ZerionLogoWide />
      </div>
    </div>
  );
}
