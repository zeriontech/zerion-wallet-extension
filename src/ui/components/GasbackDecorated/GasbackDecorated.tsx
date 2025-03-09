import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';

export function GasbackDecorated({ value }: { value: number }) {
  return (
    <HStack
      gap={8}
      justifyContent="space-between"
      alignItems="center"
      style={{
        padding: '8px 12px',
        borderRadius: 12,
        background:
          'linear-gradient(90deg, rgba(160, 36, 239, 0.20) 0%, rgba(253, 187, 108, 0.20) 100%)',
      }}
    >
      <UIText kind="small/accent">Gasback</UIText>
      <UIText
        kind="small/accent"
        style={{
          background: 'linear-gradient(90deg, #6C6CF9 0%, #FF7583 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {new Intl.NumberFormat('en').format(value)}
      </UIText>
    </HStack>
  );
}
