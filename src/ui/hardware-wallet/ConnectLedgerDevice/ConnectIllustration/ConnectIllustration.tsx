import React from 'react';
import LedgerBody from 'jsx:../../assets/ledger-body.svg';
import LedgerWire from 'jsx:../../assets/ledger-wire.svg';
import LedgerText from 'jsx:../../assets/ledger-screen-text.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import * as styles from './styles.module.css';

export function ConnectIllustration() {
  return (
    <HStack
      gap={0}
      justifyContent="space-between"
      alignItems="center"
      style={{ overflow: 'hidden' }}
    >
      <LedgerWire
        style={{
          animation: `${styles.connectWire} 2.5s`,
          animationDelay: '1s',
          animationFillMode: 'backwards',
        }}
      />
      <div style={{ position: 'relative', left: -4 }}>
        <LedgerBody />
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
