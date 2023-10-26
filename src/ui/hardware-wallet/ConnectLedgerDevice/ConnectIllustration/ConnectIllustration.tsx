import React from 'react';
import LedgerBody from 'jsx:../../assets/ledger-body.svg';
import LedgerWire from 'jsx:../../assets/ledger-wire.svg';
import LedgerText from 'jsx:../../assets/ledger-screen-text.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import * as styles from './styles.module.css';

export function ConnectIllustration() {
  return (
    <HStack gap={0} justifyContent="space-between" alignItems="center">
      <LedgerWire
        style={{
          animation: `${styles.connectWire} 2s`,
          animationDelay: '1s',
          animationFillMode: 'backwards',
          animationTimingFunction: 'ease-in-out',
          zIndex: 1,
        }}
      />
      <div style={{ position: 'relative', left: -4, zIndex: 1 }}>
        <svg
          style={{
            position: 'absolute',
            zIndex: -1,
            left: -50,
            top: -50 + 60 / 2,
            width: 100,
            height: 100,
            animation: `${styles.pulse} 2s`,
            animationIterationCount: 3,
            animationDelay: '3.5s',
            animationFillMode: 'both',
          }}
          viewBox="0 0 100 100"
        >
          <circle r="50" cx="50" cy="50" fill="var(--neutral-700)" />
        </svg>
        <LedgerBody style={{ zIndex: 1 }} />
        <div
          style={{
            position: 'absolute',
            left: 80,
            top: 14,
            width: 56,
            height: 32,
            backgroundColor: '#2c2c2e',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 80,
            top: 14,
            width: 56,
            height: 32,
            animationName: styles.flash,
            animationDelay: '3.5s',
            animationDuration: '2.5s',
            animationTimingFunction: 'steps(2, jump-none)',
            animationFillMode: 'backwards',
          }}
        >
          <LedgerText />
        </div>
      </div>
    </HStack>
  );
}
