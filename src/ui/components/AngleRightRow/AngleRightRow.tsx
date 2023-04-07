import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import ChevronRightIcon from 'jsx:src/ui/assets/chevron-right.svg';

export function AngleRightRow({
  iconColor = 'var(--neutral-500)',
  hideIcon = false,
  children,
}: React.PropsWithChildren<{ iconColor?: string; hideIcon?: boolean }>) {
  return (
    <HStack gap={4} justifyContent="space-between" alignItems="center">
      {children}

      {hideIcon ? null : (
        <span style={{ color: iconColor }}>
          <ChevronRightIcon style={{ display: 'block' }} />
        </span>
      )}
    </HStack>
  );
}
