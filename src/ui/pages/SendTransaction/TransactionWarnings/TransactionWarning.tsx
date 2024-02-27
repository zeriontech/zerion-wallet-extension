import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import ValidationErrorIcon from 'jsx:src/ui/assets/validation-error.svg';
import { UIText } from 'src/ui/ui-kit/UIText';

type Kind = 'danger' | 'warning' | 'info';
const BORDER_COLOR: Record<Kind, string> = {
  danger: 'var(--negative-500)',
  warning: 'var(--notice-500)',
  info: 'var(--neutral-600)',
};
const COLOR: Record<Kind, string> = {
  danger: 'var(--negative-500)',
  warning: 'var(--notice-600)',
  info: 'var(--neutral-600)',
};

export function TransactionWarning({
  title,
  message,
  footer,
  kind = 'warning',
  style,
}: {
  title?: string;
  message: React.ReactNode;
  footer?: React.ReactNode;
  kind?: 'danger' | 'warning' | 'info';
  style?: React.CSSProperties;
}) {
  return (
    <VStack
      gap={8}
      style={{
        padding: 16,
        borderRadius: 8,
        border: `1px solid ${BORDER_COLOR[kind]}`,
        justifyItems: 'start',
        ...style,
      }}
    >
      {title ? (
        <HStack gap={8} alignItems="center">
          <ValidationErrorIcon style={{ color: COLOR[kind] }} />
          <UIText kind="body/accent" color={COLOR[kind]}>
            {title}
          </UIText>
        </HStack>
      ) : null}
      {message ? (
        <UIText
          kind="small/regular"
          color={COLOR[kind]}
          style={{ width: '100%' }}
        >
          {message}
        </UIText>
      ) : null}
      {footer}
    </VStack>
  );
}
