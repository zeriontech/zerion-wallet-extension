import React from 'react';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';

type Kind = 'danger' | 'warning' | 'info';
const BORDER_COLOR: Record<Kind, string> = {
  danger: 'var(--negative-300)',
  warning: 'var(--notice-300)',
  info: 'var(--neutral-500)',
};
const BACKGROUND_GRADIENT: Record<Kind, string> = {
  danger:
    'linear-gradient(94deg, var(--negative-200) 0%, var(--negative-300) 100%)',
  warning:
    'linear-gradient(94deg, var(--notice-200) 0%, var(--notice-300) 100%)',
  info: 'linear-gradient(94deg, var(--neutral-200) 0%, var(--neutral-300) 100%)',
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
  kind?: Kind;
  style?: React.CSSProperties;
}) {
  return (
    <VStack
      gap={8}
      style={{
        padding: '12px 16px',
        borderRadius: 24,
        border: `1px solid ${BORDER_COLOR[kind]}`,
        background: BACKGROUND_GRADIENT[kind],
        justifyItems: 'start',
        ...style,
      }}
    >
      {title ? (
        <UIText kind="body/accent" color={COLOR[kind]}>
          {title}
        </UIText>
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
