import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import ValidationErrorIcon from 'jsx:src/ui/assets/validation-error.svg';
import { Surface } from 'src/ui/ui-kit/Surface';
import { UIText } from 'src/ui/ui-kit/UIText';

type Kind = 'warning' | 'danger';

const kinds: { [kind in Kind]: React.CSSProperties } = {
  warning: {
    borderColor: 'var(--notice-500)',
    color: 'var(--notice-600)',
  },
  danger: {
    borderColor: 'var(--negative-500)',
    color: 'var(--negative-500)',
  },
};

interface Props {
  kind: Kind;
  title: React.ReactNode;
  text: React.ReactNode;
  actions?: React.ReactNode;
}

export function ValidationMessage({ kind, title, text, actions }: Props) {
  const style = Object.assign(
    {
      borderWidth: 1,
      borderStyle: 'solid',
    },
    kinds[kind]
  );

  return (
    <Surface padding={16} style={style}>
      <VStack gap={8}>
        <HStack gap={8} alignItems="center">
          <ValidationErrorIcon />
          <UIText kind="body/accent">{title}</UIText>
        </HStack>
        <UIText kind="small/regular">{text}</UIText>
        {actions}
      </VStack>
    </Surface>
  );
}
