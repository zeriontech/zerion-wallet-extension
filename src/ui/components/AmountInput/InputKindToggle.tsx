import React from 'react';
import ReverseIcon from 'jsx:src/ui/assets/reverse.svg';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { HStack } from 'src/ui/ui-kit/HStack/HStack';
import type { InputKind } from './inputKind';

export function InputKindToggle({
  inputKind,
  currencyCode,
  tokenSymbol,
  onToggle,
}: {
  inputKind: InputKind;
  currencyCode: string;
  tokenSymbol: string;
  onToggle: () => void;
}) {
  const targetLabel =
    inputKind === 'token'
      ? currencyCode.toUpperCase()
      : tokenSymbol.toUpperCase();
  return (
    <UnstyledButton type="button" onClick={onToggle}>
      <HStack gap={4} alignItems="center">
        <UIText kind="small/regular" color="var(--primary)">
          {targetLabel}
        </UIText>
        <ReverseIcon
          style={{ width: 16, height: 16, color: 'var(--primary)' }}
        />
      </HStack>
    </UnstyledButton>
  );
}
