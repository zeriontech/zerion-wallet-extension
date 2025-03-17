import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';

export function BridgeLine() {
  return (
    <HStack
      gap={12}
      justifyContent="space-between"
      alignItems="center"
      style={{ height: 24 }}
    ></HStack>
  );
}
