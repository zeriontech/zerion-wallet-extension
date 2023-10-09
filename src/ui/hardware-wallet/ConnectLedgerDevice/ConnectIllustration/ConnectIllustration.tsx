import React from 'react';
import LedgerBody from 'jsx:../../assets/ledger-body.svg';
import LedgerWire from 'jsx:../../assets/ledger-wire.svg';
import { HStack } from 'src/ui/ui-kit/HStack';

export function ConnectIllustration() {
  return (
    <HStack
      gap={0}
      justifyContent="space-between"
      alignItems="center"
      style={{ overflow: 'hidden' }}
    >
      <LedgerWire />
      <LedgerBody />
    </HStack>
  );
}
