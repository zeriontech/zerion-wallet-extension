import React from 'react';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';

export const QUICK_AMOUNTS: { title: string; factor: number }[] = [
  { title: '25%', factor: 0.25 },
  { title: '50%', factor: 0.5 },
  { title: 'MAX', factor: 1 },
];

export function QuickAmountButton({
  children,
  onClick,
}: React.PropsWithChildren<{
  onClick(): void;
}>) {
  return (
    <UnstyledButton type="button" onClick={onClick}>
      <UIText kind="small/regular" color="var(--primary)">
        {children}
      </UIText>
    </UnstyledButton>
  );
}
