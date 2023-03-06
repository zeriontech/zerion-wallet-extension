import React from 'react';
import { HStack } from '../ui-kit/HStack';
import { VStack } from '../ui-kit/VStack';

export const Stack = React.forwardRef<
  HTMLDivElement,
  {
    gap: number;
    direction: 'vertical' | 'horisontal';
    children: React.ReactNode;
  } & React.HTMLAttributes<HTMLDivElement>
>(({ gap, direction, children, ...props }, ref) => {
  return direction === 'horisontal' ? (
    <HStack ref={ref} gap={gap} {...props}>
      {children}
    </HStack>
  ) : (
    <VStack ref={ref} gap={gap} {...props}>
      {children}
    </VStack>
  );
});
