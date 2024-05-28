import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import ChevronRightIcon from 'jsx:src/ui/assets/chevron-right.svg';
import ExternalLinkIcon from 'jsx:src/ui/assets/new-window.svg';

export function AngleRightRow({
  iconColor = 'var(--neutral-400)',
  hideIcon = false,
  kind = 'button',
  children,
}: React.PropsWithChildren<{
  iconColor?: string;
  hideIcon?: boolean;
  kind?: 'button' | 'link';
}>) {
  return (
    <HStack
      gap={4}
      justifyContent="space-between"
      alignItems="center"
      style={{ gridTemplateColumns: '1fr auto' }}
    >
      {children}

      {hideIcon ? null : (
        <span style={{ color: iconColor }}>
          {kind === 'button' ? (
            <ChevronRightIcon style={{ display: 'block' }} />
          ) : (
            <ExternalLinkIcon style={{ display: 'block' }} />
          )}
        </span>
      )}
    </HStack>
  );
}
